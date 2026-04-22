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
import { renderComparisonHtmlToImageBuffer } from "../services/htmlRender.service";
import {
  uploadImageBufferToCloudinary,
  CloudinaryUploadError
} from "../services/cloudinary.service";
import { buildComparisonResultHtml } from "../services/comparisonTemplate.service";
import {
  CalculatorResult,
  ComparisonRow
} from "../shared/unitedFinancialCalculator";

const roundToTwoDecimals = (n: number): number =>
  Number.isFinite(n) ? Math.round(n * 100) / 100 : n;

const roundComparisonRowForWebhook = (row: ComparisonRow): ComparisonRow => ({
  ...row,
  monthlyPayment: roundToTwoDecimals(row.monthlyPayment),
  apr: roundToTwoDecimals(row.apr)
});

const buildResultForWebhook = (result: CalculatorResult): CalculatorResult => ({
  ...result,
  heloan: roundComparisonRowForWebhook(result.heloan),
  cashRefi15: roundComparisonRowForWebhook(result.cashRefi15),
  cashRefi30: roundComparisonRowForWebhook(result.cashRefi30)
});

interface ImageRenderStatus {
  success: boolean;
  message: string;
  imageUrl?: string;
}

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
  process.env.RESULT_WEBHOOK_URL?.trim()
  || process.env.UNITED_FINANCIAL_RESULT_WEBHOOK_URL?.trim()
  || DEFAULT_RESULT_WEBHOOK_URL;

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
  const resultForWebhook = buildResultForWebhook(result);
  const generatedAt = new Date().toISOString();

  const imageRender: ImageRenderStatus = {
    success: false,
    message: "Image rendering skipped"
  };
  let comparisonImageUrl: string | undefined;
  let comparisonImageBase64: string | undefined;
  let comparisonImageFile:
    | {
        filename: string;
        contentType: string;
        encoding: string;
        size: number;
        data: string;
      }
    | undefined;

  try {
    const html = buildComparisonResultHtml({
      result,
      meta: normalization.meta,
      generatedAt
    });
    const pngBuffer = await renderComparisonHtmlToImageBuffer(html);
    const rawBase64 = pngBuffer.toString("base64");
    comparisonImageBase64 = `data:image/png;base64,${rawBase64}`;
    comparisonImageFile = {
      filename: "comparison-result.png",
      contentType: "image/png",
      encoding: "base64",
      size: pngBuffer.length,
      data: rawBase64
    };
    console.log("[comparison-image] render success", `${pngBuffer.length} bytes`);

    try {
      const uploaded = await uploadImageBufferToCloudinary(pngBuffer);
      comparisonImageUrl = uploaded.secureUrl;
      imageRender.success = true;
      imageRender.message = "Uploaded to Cloudinary";
      imageRender.imageUrl = uploaded.secureUrl;
      console.log("[comparison-image] uploaded", uploaded.secureUrl);
    } catch (uploadError) {
      const details =
        uploadError instanceof CloudinaryUploadError && uploadError.details
          ? uploadError.details
          : (uploadError as Error)?.message;
      imageRender.success = false;
      imageRender.message = details
        ? `Cloudinary upload failed: ${details}`
        : "Cloudinary upload failed";
      console.error("[comparison-image] upload failed:", details ?? "unknown error");
    }
  } catch (renderError) {
    const message = (renderError as Error)?.message ?? "HTML render failed";
    imageRender.success = false;
    imageRender.message = "HTML render failed";
    console.error("[comparison-image] render failed:", message);
  }

  const webhookPayload: Record<string, unknown> = {
    success: true,
    meta: normalization.meta,
    normalizedPayload: validation.data,
    result: resultForWebhook,
    generatedAt
  };
  if (comparisonImageUrl) {
    webhookPayload.comparisonImageUrl = comparisonImageUrl;
  }
  if (comparisonImageBase64) {
    webhookPayload.comparisonImageBase64 = comparisonImageBase64;
  }
  if (comparisonImageFile) {
    webhookPayload.comparisonImageFile = comparisonImageFile;
  }

  const resultWebhookUrl = getResultWebhookUrl();

  // Build a readable log version that doesn't dump the full base64.
  const payloadForLog: Record<string, unknown> = { ...webhookPayload };
  if (comparisonImageBase64) {
    payloadForLog.comparisonImageBase64 = `<base64 data URL, ${comparisonImageBase64.length} chars>`;
  }
  if (comparisonImageFile) {
    payloadForLog.comparisonImageFile = {
      ...comparisonImageFile,
      data: `<base64 ${comparisonImageFile.size} bytes>`
    };
  }

  console.log("[result-webhook] POST ->", resultWebhookUrl);
  console.log("[result-webhook] payload:", JSON.stringify(payloadForLog, null, 2));

  try {
    await forwardUnitedFinancialWebhookResult(resultWebhookUrl, webhookPayload);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Processed successfully. Full response has been sent to the configured result webhook.",
      imageRender
    });
  } catch (error) {
    if (error instanceof WebhookForwarderError) {
      res.status(error.statusCode).json({
        success: false,
        statusCode: error.statusCode,
        message: `Processed successfully, but failed to forward the response to the result webhook: ${error.message}`,
        imageRender
      });
      return;
    }

    res.status(502).json({
      success: false,
      statusCode: 502,
      message: "Processed successfully, but failed to forward the response to the result webhook.",
      imageRender
    });
  }
};
