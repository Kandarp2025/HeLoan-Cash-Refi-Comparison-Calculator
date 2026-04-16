"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeUnitedFinancialWebhookPayload = exports.toRequiredNumber = exports.findValueByPattern = exports.findFirstValueByKeys = void 0;
const FIELD_PATTERNS = {
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
const normalizeKey = (value) => {
    return value.toLowerCase().replace(/[\s_]/g, "");
};
const flattenPayload = (rawPayload) => {
    const nestedData = rawPayload.data;
    if (nestedData && typeof nestedData === "object" && !Array.isArray(nestedData)) {
        return nestedData;
    }
    return rawPayload;
};
const findFirstValueByKeys = (raw, keys) => {
    for (const key of keys) {
        if (key in raw) {
            return raw[key];
        }
    }
    return undefined;
};
exports.findFirstValueByKeys = findFirstValueByKeys;
const findValueByPattern = (raw, patterns) => {
    for (const [key, value] of Object.entries(raw)) {
        const normalizedKey = normalizeKey(key);
        const hasPatternMatch = patterns.some((pattern) => normalizedKey.includes(pattern));
        if (hasPatternMatch) {
            return value;
        }
    }
    return undefined;
};
exports.findValueByPattern = findValueByPattern;
const toRequiredNumber = (value, label) => {
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
exports.toRequiredNumber = toRequiredNumber;
const detectHeloanRepaymentYears = (rawPayload) => {
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
const extractMeta = (rawPayload) => {
    const id = (0, exports.findFirstValueByKeys)(rawPayload, METADATA_KEYS.id);
    const name = (0, exports.findFirstValueByKeys)(rawPayload, METADATA_KEYS.name);
    const email = (0, exports.findFirstValueByKeys)(rawPayload, METADATA_KEYS.email);
    return {
        id: typeof id === "string" || typeof id === "number" ? id : undefined,
        name: typeof name === "string" ? name : undefined,
        email: typeof email === "string" ? email : undefined
    };
};
const normalizeUnitedFinancialWebhookPayload = (rawPayload) => {
    const errors = [];
    const flattenedPayload = flattenPayload(rawPayload);
    const normalizedPayload = {
        heloanRepaymentYears: detectHeloanRepaymentYears(flattenedPayload)
    };
    Object.keys(FIELD_PATTERNS).forEach((field) => {
        const attemptedPatterns = FIELD_PATTERNS[field];
        const rawValue = (0, exports.findValueByPattern)(flattenedPayload, attemptedPatterns);
        const extraction = (0, exports.toRequiredNumber)(rawValue, field);
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
        normalizedPayload: normalizedPayload,
        meta
    };
};
exports.normalizeUnitedFinancialWebhookPayload = normalizeUnitedFinancialWebhookPayload;
//# sourceMappingURL=unitedFinancialWebhookNormalizer.service.js.map