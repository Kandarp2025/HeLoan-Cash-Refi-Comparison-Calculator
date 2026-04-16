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
      callbackUrl?: string;
      data?: RawWebhookPayload;
    }
  | RawWebhookPayload;

export const processUnitedFinancialWebhook = async (
  req: Request<unknown, unknown, ProcessWebhookRequestBody>,
  res: Response
): Promise<void> => {
  const body = req.body as Record<string, unknown> | undefined;
  const callbackUrl = typeof body?.callbackUrl === "string" ? body.callbackUrl : undefined;

  const rawPayloadCandidate = (body?.data as RawWebhookPayload | undefined) ?? (req.body as RawWebhookPayload);
  const rawPayload: RawWebhookPayload =
    callbackUrl && rawPayloadCandidate && typeof rawPayloadCandidate === "object" && !Array.isArray(rawPayloadCandidate)
      ? (() => {
          const copy = { ...(rawPayloadCandidate as Record<string, unknown>) };
          delete (copy as { callbackUrl?: unknown }).callbackUrl;
          return copy;
        })()
      : rawPayloadCandidate;

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

  let comparisonImageBase64: string;
  try {
    const screenshotBuffer = await generateUnitedFinancialComparisonScreenshot(html);
    comparisonImageBase64 = bufferToPngDataUrl(screenshotBuffer);
  } catch (error) {
    if (error instanceof ScreenshotServiceError) {
      res.status(500).json({
        success: false,
        message: error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Unable to generate comparison image"
    });
    return;
  }

  const generatedAt = new Date().toISOString();
  const finalResponse = {
    success: true,
    meta: normalization.meta,
    normalizedPayload: validation.data,
    result,
    comparisonImageBase64,
    generatedAt
  };

  if (!callbackUrl) {
    res.status(200).json(finalResponse);
    return;
  }

  try {
    const forwarding = await forwardUnitedFinancialWebhookResult(callbackUrl, finalResponse);

    res.status(200).json({
      success: true,
      message: "Processed successfully and forwarded to callback URL",
      forwarded: true,
      callbackUrl: forwarding.callbackUrl,
      forwarding: {
        status: forwarding.status,
        statusText: forwarding.statusText
      },
      data: finalResponse
    });
  } catch (error) {
    if (error instanceof WebhookForwarderError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        callbackUrl: error.callbackUrl,
        details: error.details
      });
      return;
    }

    res.status(502).json({
      success: false,
      message: "Unable to forward webhook result to callback URL",
      callbackUrl
    });
  }
};
