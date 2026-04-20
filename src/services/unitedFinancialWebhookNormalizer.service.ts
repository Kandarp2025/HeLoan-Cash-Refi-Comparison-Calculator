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

type CalculatorField = keyof Omit<UnitedFinancialCalculatorInput, "heloanRepaymentYears">;

interface FieldMatchRule {
  exactNormalizedKeys: string[];
  requiredTokens?: string[];
  anyOfTokens?: string[];
  optionalTokens?: string[];
  rejectTokens?: string[];
}

interface FieldDefinition {
  attemptedPatterns: string[];
  rules: FieldMatchRule;
}

interface MatchCandidate {
  rawKey: string;
  normalizedKey: string;
  value: unknown;
  score: number;
}

const FIELD_DEFINITIONS: Record<CalculatorField, FieldDefinition> = {
  homeValue: {
    attemptedPatterns: ["homevalue", "propertyvalue"],
    rules: {
      exactNormalizedKeys: ["homevalue", "propertyvalue"]
    }
  },
  currentMortgageBalance: {
    attemptedPatterns: ["currentmortgagebalance", "firstmortgagebalance", "mortgagebalance"],
    rules: {
      exactNormalizedKeys: ["currentmortgagebalance", "firstmortgagebalance", "mortgagebalance"]
    }
  },
  cashRefiRate15: {
    attemptedPatterns: [
      "cashrefi15yrinterestrate",
      "cashrefirate15",
      "cashrefi15yearinterestrate",
      "cash+refi+15+rate"
    ],
    rules: {
      exactNormalizedKeys: ["cashrefi15yrinterestrate", "cashrefirate15", "cashrefi15yearinterestrate"],
      requiredTokens: ["cash", "refi", "15", "rate"],
      optionalTokens: ["interest"]
    }
  },
  cashRefiRate30: {
    attemptedPatterns: [
      "cashrefi30yrinterestrate",
      "cashrefirate30",
      "cashrefi30yearinterestrate",
      "cash+refi+30+rate"
    ],
    rules: {
      exactNormalizedKeys: ["cashrefi30yrinterestrate", "cashrefirate30", "cashrefi30yearinterestrate"],
      requiredTokens: ["cash", "refi", "30", "rate"],
      optionalTokens: ["interest"]
    }
  },
  cashRefiFeePercent: {
    attemptedPatterns: ["fee", "fees", "cashrefifeepercent"],
    rules: {
      exactNormalizedKeys: ["fee", "fees", "cashrefifeepercent"]
    }
  },
  cashRefiFlatFee: {
    attemptedPatterns: ["flatfee", "cashrefiflatfee"],
    rules: {
      exactNormalizedKeys: ["flatfee", "cashrefiflatfee"]
    }
  },
  heloanAmount: {
    attemptedPatterns: [
      "cashoutorheloanamt",
      "heloanamount",
      "cashrequested",
      "cashoutamount",
      "amount|amt|requested"
    ],
    rules: {
      exactNormalizedKeys: ["cashoutorheloanamt", "heloanamount", "cashrequested", "cashoutamount"],
      requiredTokens: ["heloan"],
      anyOfTokens: ["amount", "amt", "requested"],
      optionalTokens: ["cashout", "cash"],
      rejectTokens: ["rate", "interest", "interestrate"]
    }
  },
  heloanRate: {
    attemptedPatterns: [
      "heloan10years",
      "heloan15years",
      "heloan20years",
      "heloan30years",
      "heloanrate",
      "heloan10yearrate",
      "heloan15yearrate",
      "heloan20yearrate",
      "heloan30yearrate",
      "heloaninterestrate"
    ],
    rules: {
      exactNormalizedKeys: [
        "heloan10years",
        "heloan15years",
        "heloan20years",
        "heloan30years",
        "heloanrate",
        "heloan10yearrate",
        "heloan15yearrate",
        "heloan20yearrate",
        "heloan30yearrate",
        "heloaninterestrate"
      ],
      requiredTokens: ["heloan"],
      anyOfTokens: ["rate", "interest", "10year", "15year", "20year", "30year", "10years", "15years", "20years", "30years"],
      optionalTokens: ["10", "15", "20", "30"],
      rejectTokens: ["amount", "amt", "cashout", "requested"]
    }
  },
  heloanFeePercent: {
    attemptedPatterns: ["fee", "fees", "heloanfeepercent"],
    rules: {
      exactNormalizedKeys: ["fee", "fees", "heloanfeepercent"]
    }
  },
  heloanFlatFee: {
    attemptedPatterns: ["flatfee", "heloanflatfee"],
    rules: {
      exactNormalizedKeys: ["flatfee", "heloanflatfee"]
    }
  }
};

const METADATA_KEYS = {
  id: ["id"],
  name: ["name"],
  email: ["email"],
  phone: ["phone", "Phone", "phoneNumber", "phone_number"]
};

const ALLOWED_HELOAN_REPAYMENT_YEARS = new Set([10, 15, 20, 30]);

const normalizeKey = (value: string): string => {
  return value.toLowerCase().replace(/[\s_-]/g, "");
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

const scoreCandidate = (normalizedKey: string, rules: FieldMatchRule): number | undefined => {
  if (rules.rejectTokens?.some((token) => normalizedKey.includes(token))) {
    return undefined;
  }

  let score = 0;

  if (rules.exactNormalizedKeys.includes(normalizedKey)) {
    score = 100;
  }

  const hasAllRequiredTokens = !rules.requiredTokens || rules.requiredTokens.every((token) => normalizedKey.includes(token));
  if (!hasAllRequiredTokens) {
    return score > 0 ? score : undefined;
  }

  const hasAnyRequiredAlternative = !rules.anyOfTokens || rules.anyOfTokens.some((token) => normalizedKey.includes(token));
  if (!hasAnyRequiredAlternative) {
    return score > 0 ? score : undefined;
  }

  if ((rules.requiredTokens && rules.requiredTokens.length > 0) || (rules.anyOfTokens && rules.anyOfTokens.length > 0)) {
    score = Math.max(score, 80);
  }

  if (rules.optionalTokens) {
    for (const token of rules.optionalTokens) {
      if (normalizedKey.includes(token)) {
        score += 5;
      }
    }
  }

  return score > 0 ? score : undefined;
};

const findBestFieldMatch = (raw: RawWebhookPayload, fieldDefinition: FieldDefinition): MatchCandidate | undefined => {
  let bestMatch: MatchCandidate | undefined;

  for (const [rawKey, value] of Object.entries(raw)) {
    const normalizedKey = normalizeKey(rawKey);
    const score = scoreCandidate(normalizedKey, fieldDefinition.rules);
    if (score === undefined) {
      continue;
    }

    if (
      !bestMatch
      || score > bestMatch.score
      || (score === bestMatch.score && normalizedKey.length > bestMatch.normalizedKey.length)
    ) {
      bestMatch = {
        rawKey,
        normalizedKey,
        value,
        score
      };
    }
  }

  return bestMatch;
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

const detectHeloanRepaymentYears = (matchedRateKey?: string): number => {
  if (!matchedRateKey) {
    return 20;
  }

  const normalizedKey = normalizeKey(matchedRateKey);
  const yearMatch = normalizedKey.match(/(10|15|20|30)years?/);
  if (!yearMatch) {
    return 20;
  }

  const parsedYears = Number(yearMatch[1]);
  if (ALLOWED_HELOAN_REPAYMENT_YEARS.has(parsedYears)) {
    return parsedYears;
  }

  return 20;
};

const extractMeta = (rawPayload: RawWebhookPayload): UnitedFinancialWebhookMeta => {
  const id = findFirstValueByKeys(rawPayload, METADATA_KEYS.id);
  const name = findFirstValueByKeys(rawPayload, METADATA_KEYS.name);
  const email = findFirstValueByKeys(rawPayload, METADATA_KEYS.email);
  const phone = findFirstValueByKeys(rawPayload, METADATA_KEYS.phone);

  let phoneValue: string | undefined;
  if (typeof phone === "string") {
    const trimmed = phone.trim();
    phoneValue = trimmed.length > 0 ? trimmed : undefined;
  } else if (typeof phone === "number" && Number.isFinite(phone)) {
    phoneValue = String(phone);
  }

  return {
    id: typeof id === "string" || typeof id === "number" ? id : undefined,
    name: typeof name === "string" ? name : undefined,
    email: typeof email === "string" ? email : undefined,
    phone: phoneValue
  };
};

export const normalizeUnitedFinancialWebhookPayload = (
  rawPayload: RawWebhookPayload
): UnitedFinancialWebhookNormalizationResult => {
  const errors: WebhookNormalizationFieldError[] = [];
  const flattenedPayload = flattenPayload(rawPayload);
  const normalizedPayload: Partial<UnitedFinancialCalculatorInput> = {};
  let heloanRateMatchedKey: string | undefined;

  (Object.keys(FIELD_DEFINITIONS) as CalculatorField[]).forEach((field) => {
    const fieldDefinition = FIELD_DEFINITIONS[field];
    const match = findBestFieldMatch(flattenedPayload, fieldDefinition);
    const extraction = toRequiredNumber(match?.value, field);

    if (typeof extraction.value === "number") {
      normalizedPayload[field] = extraction.value;

      if (field === "heloanRate") {
        heloanRateMatchedKey = match?.rawKey;
      }

      return;
    }

    errors.push({
      field,
      message: extraction.error ?? `${field} is invalid`,
      attemptedPatterns: fieldDefinition.attemptedPatterns,
      matchedKey: match?.rawKey
    });
  });

  normalizedPayload.heloanRepaymentYears = detectHeloanRepaymentYears(heloanRateMatchedKey);

  const meta = extractMeta(rawPayload);

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
