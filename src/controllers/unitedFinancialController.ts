import { Request, Response } from "express";
import { UnitedFinancialCalculatorInput } from "../types/unitedFinancial.types";
import { runUnitedFinancialCalculation } from "../services/unitedFinancialCalculator.service";
import { renderUnitedFinancialComparisonHtml } from "../templates/unitedFinancialComparison.template";
import { normalizeUnitedFinancialWebhookPayload } from "../services/unitedFinancialWebhookNormalizer.service";
import { RawWebhookPayload } from "../types/unitedFinancialWebhook.types";
import { unitedFinancialPayloadSchema } from "../validators/unitedFinancial.validator";
import {
  bufferToPngDataUrl,
  generateUnitedFinancialComparisonScreenshot,
  ScreenshotServiceError
} from "../services/unitedFinancialScreenshot.service";
import {
  forwardUnitedFinancialWebhookResult,
  WebhookForwarderError
} from "../services/unitedFinancialWebhookForwarder.service";

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

export const renderUnitedFinancialComparisonImageResponse = async (
  req: Request<unknown, unknown, UnitedFinancialCalculatorInput>,
  res: Response
): Promise<void> => {
  try {
    const result = runUnitedFinancialCalculation(req.body);
    const html = renderUnitedFinancialComparisonHtml(result);
    const screenshotBuffer = await generateUnitedFinancialComparisonScreenshot(html);
    const comparisonImageBase64 = bufferToPngDataUrl(screenshotBuffer);

    res.status(200).json({
      success: true,
      data: {
        result,
        comparisonImageBase64
      }
    });
  } catch (error) {
    if (error instanceof ScreenshotServiceError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Unable to generate comparison image"
    });
  }
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

type ProcessWebhookRequestBody =
  | {
      data?: RawWebhookPayload;
    }
  | RawWebhookPayload;

const DEFAULT_RESULT_WEBHOOK_URL =
  "https://services.leadconnectorhq.com/hooks/LNMN6oG6KxnHqWFFholL/webhook-trigger/a4d636e6-dd17-4f8a-96db-fc81052006c8";

const getResultWebhookUrl = (): string =>
  process.env.UNITED_FINANCIAL_RESULT_WEBHOOK_URL?.trim() || DEFAULT_RESULT_WEBHOOK_URL;

export const processUnitedFinancialWebhook = async (
  req: Request<unknown, unknown, ProcessWebhookRequestBody>,
  res: Response
): Promise<void> => {
  const body = req.body as Record<string, unknown> | undefined;
  const rawPayload: RawWebhookPayload =
    (body?.data as RawWebhookPayload | undefined) ?? (req.body as RawWebhookPayload);

  const normalization = normalizeUnitedFinancialWebhookPayload(rawPayload);
  if (!normalization.success) {
    res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Unable to normalize webhook payload into calculator input",
      errors: normalization.errors
    });
    return;
  }

  const normalizedPayload = normalization.normalizedPayload;
  const validation = unitedFinancialPayloadSchema.safeParse(normalizedPayload);
  if (!validation.success) {
    res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Normalized payload failed calculator validation",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message
      }))
    });
    return;
  }

  const result = runUnitedFinancialCalculation(validation.data);
  const html = renderUnitedFinancialComparisonHtml(result);

  let comparisonImageBase64: string;
  try {
    const screenshotBuffer = await generateUnitedFinancialComparisonScreenshot(html);
    comparisonImageBase64 = bufferToPngDataUrl(screenshotBuffer);
  } catch (error) {
    const message =
      error instanceof ScreenshotServiceError
        ? error.message
        : "Unable to generate comparison image";

    res.status(500).json({
      success: false,
      statusCode: 500,
      message
    });
    return;
  }

  const generatedAt = new Date().toISOString();
  const webhookPayload = {
    success: true,
    meta: normalization.meta,
    normalizedPayload: validation.data,
    result,
    comparisonImageBase64,
    generatedAt
  };

  const resultWebhookUrl = getResultWebhookUrl();

  const ghlUpload = {
    success: false,
    message: "GHL upload disabled"
  };

  try {
    await forwardUnitedFinancialWebhookResult(resultWebhookUrl, webhookPayload);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Processed successfully. Full response has been sent to the configured result webhook.",
      ghlUpload
    });
  } catch (error) {
    if (error instanceof WebhookForwarderError) {
      res.status(error.statusCode).json({
        success: false,
        statusCode: error.statusCode,
        message: `Processed successfully, but failed to forward the response to the result webhook: ${error.message}`,
        ghlUpload
      });
      return;
    }

    res.status(502).json({
      success: false,
      statusCode: 502,
      message: "Processed successfully, but failed to forward the response to the result webhook.",
      ghlUpload
    });
  }
};
