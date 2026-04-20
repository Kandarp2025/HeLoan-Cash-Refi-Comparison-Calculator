import { UnitedFinancialCalculatorInput } from "./unitedFinancial.types";

export type RawWebhookPayload = Record<string, unknown>;

export interface UnitedFinancialWebhookMeta {
  id?: string | number;
  name?: string;
  email?: string;
  phone?: string;
}

export interface WebhookNormalizationFieldError {
  field: keyof UnitedFinancialCalculatorInput;
  message: string;
  attemptedPatterns: string[];
  matchedKey?: string;
}

export interface UnitedFinancialWebhookNormalizationSuccess {
  success: true;
  normalizedPayload: UnitedFinancialCalculatorInput;
  meta: UnitedFinancialWebhookMeta;
}

export interface UnitedFinancialWebhookNormalizationFailure {
  success: false;
  errors: WebhookNormalizationFieldError[];
  meta: UnitedFinancialWebhookMeta;
}

export type UnitedFinancialWebhookNormalizationResult =
  | UnitedFinancialWebhookNormalizationSuccess
  | UnitedFinancialWebhookNormalizationFailure;
