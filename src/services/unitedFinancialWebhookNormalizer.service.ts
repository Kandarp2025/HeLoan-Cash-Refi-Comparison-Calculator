import { UnitedFinancialCalculatorInput } from "../types/unitedFinancial.types";
import {
  RawWebhookPayload,
  UnitedFinancialWebhookMeta,
  UnitedFinancialWebhookNormalizationResult,
  WebhookNormalizationFieldError
} from "../types/unitedFinancialWebhook.types";

interface NumberExtractionResult {
  value?: number;
  error?: string;
}

const FIELD_PATTERNS: Record<keyof Omit<UnitedFinancialCalculatorInput, "heloanRepaymentYears">, string[]> = {
  homeValue: ["homevalue", "propertyvalue"],
  currentMortgageBalance: ["mortgage", "balance"],
  cashRefiRate15: ["15yr", "15year", "15 year"],
  cashRefiRate30: ["30yr", "30year", "30 year"],
  cashRefiFeePercent: ["fee"],
  cashRefiFlatFee: ["flat"],
  heloanAmount: ["cash", "loanamount", "requested"],
  heloanRate: ["heloan", "rate"],
  heloanFeePercent: ["fee"],
  heloanFlatFee: ["flat"]
};

const METADATA_KEYS = {
  id: ["id"],
  name: ["name"],
  email: ["email"]
};

const ALLOWED_HELOAN_REPAYMENT_YEARS = new Set([10, 15, 20, 30]);

const normalizeKey = (value: string): string => {
  return value.toLowerCase().replace(/[\s_]/g, "");
};

const flattenPayload = (rawPayload: RawWebhookPayload): RawWebhookPayload => {
  const nestedData = rawPayload.data;
  if (nestedData && typeof nestedData === "object" && !Array.isArray(nestedData)) {
    return nestedData as RawWebhookPayload;
  }
  return rawPayload;
};

export const findFirstValueByKeys = (raw: RawWebhookPayload, keys: string[]): unknown => {
  for (const key of keys) {
    if (key in raw) {
      return raw[key];
    }
  }
  return undefined;
};

export const findValueByPattern = (raw: RawWebhookPayload, patterns: string[]): unknown => {
  for (const [key, value] of Object.entries(raw)) {
    const normalizedKey = normalizeKey(key);
    const hasPatternMatch = patterns.some((pattern) => normalizedKey.includes(pattern));
    if (hasPatternMatch) {
      return value;
    }
  }

  return undefined;
};

export const toRequiredNumber = (value: unknown, label: string): NumberExtractionResult => {
  if (value === undefined || value === null) {
    return { error: `${label} is required` };
  }

  if (typeof value === "number") {
    if (Number.isFinite(value)) {
      return { value };
    }
    return { error: `${label} must be a valid number` };
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return { error: `${label} is required` };
    }

    const parsed = Number(trimmed.replace(/,/g, ""));
    if (Number.isFinite(parsed)) {
      return { value: parsed };
    }

    return { error: `${label} must be a valid number` };
  }

  return { error: `${label} must be a number or numeric string` };
};

const detectHeloanRepaymentYears = (rawPayload: RawWebhookPayload): number => {
  for (const key of Object.keys(rawPayload)) {
    const normalizedKey = normalizeKey(key);
    if (!normalizedKey.includes("heloan")) {
      continue;
    }

    const yearMatch = normalizedKey.match(/(10|15|20|30)years?/);
    if (!yearMatch) {
      continue;
    }

    const parsedYears = Number(yearMatch[1]);
    if (ALLOWED_HELOAN_REPAYMENT_YEARS.has(parsedYears)) {
      return parsedYears;
    }
  }

  return 20;
};

const extractMeta = (rawPayload: RawWebhookPayload): UnitedFinancialWebhookMeta => {
  const id = findFirstValueByKeys(rawPayload, METADATA_KEYS.id);
  const name = findFirstValueByKeys(rawPayload, METADATA_KEYS.name);
  const email = findFirstValueByKeys(rawPayload, METADATA_KEYS.email);

  return {
    id: typeof id === "string" || typeof id === "number" ? id : undefined,
    name: typeof name === "string" ? name : undefined,
    email: typeof email === "string" ? email : undefined
  };
};

export const normalizeUnitedFinancialWebhookPayload = (
  rawPayload: RawWebhookPayload
): UnitedFinancialWebhookNormalizationResult => {
  const errors: WebhookNormalizationFieldError[] = [];
  const flattenedPayload = flattenPayload(rawPayload);
  const normalizedPayload: Partial<UnitedFinancialCalculatorInput> = {
    heloanRepaymentYears: detectHeloanRepaymentYears(flattenedPayload)
  };

  (
    Object.keys(FIELD_PATTERNS) as (keyof Omit<UnitedFinancialCalculatorInput, "heloanRepaymentYears">)[]
  ).forEach((field) => {
    const attemptedPatterns = FIELD_PATTERNS[field];
    const rawValue = findValueByPattern(flattenedPayload, attemptedPatterns);
    const extraction = toRequiredNumber(rawValue, field);

    if (typeof extraction.value === "number") {
      normalizedPayload[field] = extraction.value;
      return;
    }

    errors.push({
      field,
      message: extraction.error ?? `${field} is invalid`,
      attemptedPatterns
    });
  });

  const meta = extractMeta(flattenedPayload);

  if (errors.length > 0) {
    return {
      success: false,
      errors,
      meta
    };
  }

  return {
    success: true,
    normalizedPayload: normalizedPayload as UnitedFinancialCalculatorInput,
    meta
  };
};
