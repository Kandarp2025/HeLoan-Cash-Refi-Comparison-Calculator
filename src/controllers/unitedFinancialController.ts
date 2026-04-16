import { Request, Response } from "express";
import { UnitedFinancialCalculatorInput } from "../types/unitedFinancial.types";
import { runUnitedFinancialCalculation } from "../services/unitedFinancialCalculator.service";
import { renderUnitedFinancialComparisonHtml } from "../templates/unitedFinancialComparison.template";
import { normalizeUnitedFinancialWebhookPayload } from "../services/unitedFinancialWebhookNormalizer.service";
import { RawWebhookPayload } from "../types/unitedFinancialWebhook.types";
import { unitedFinancialPayloadSchema } from "../validators/unitedFinancial.validator";

export const validateUnitedFinancialPayload = (
  req: Request<unknown, unknown, UnitedFinancialCalculatorInput>,
  res: Response
): void => {
  res.status(200).json({
    success: true,
    data: req.body
  });
};

export const calculateUnitedFinancialComparison = (
  req: Request<unknown, unknown, UnitedFinancialCalculatorInput>,
  res: Response
): void => {
  const result = runUnitedFinancialCalculation(req.body);

  res.status(200).json({
    success: true,
    data: result
  });
};

export const renderUnitedFinancialComparisonHtmlResponse = (
  req: Request<unknown, unknown, UnitedFinancialCalculatorInput>,
  res: Response
): void => {
  const result = runUnitedFinancialCalculation(req.body);
  const html = renderUnitedFinancialComparisonHtml(result);

  res.status(200).type("text/html").send(html);
};

export const previewUnitedFinancialWebhook = (
  req: Request<unknown, unknown, RawWebhookPayload>,
  res: Response
): void => {
  const rawPayload = req.body;
  const normalization = normalizeUnitedFinancialWebhookPayload(rawPayload);

  if (!normalization.success) {
    res.status(400).json({
      success: false,
      message: "Unable to normalize webhook payload into calculator input",
      meta: normalization.meta,
      rawPayload,
      errors: normalization.errors
    });
    return;
  }

  const normalizedPayload = normalization.normalizedPayload;
  const validation = unitedFinancialPayloadSchema.safeParse(normalizedPayload);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: "Normalized payload failed calculator validation",
      meta: normalization.meta,
      rawPayload,
      normalizedPayload,
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message
      }))
    });
    return;
  }

  const result = runUnitedFinancialCalculation(validation.data);
  const html = renderUnitedFinancialComparisonHtml(result);

  res.status(200).json({
    success: true,
    meta: normalization.meta,
    rawPayload,
    normalizedPayload: validation.data,
    result,
    html
  });
};
