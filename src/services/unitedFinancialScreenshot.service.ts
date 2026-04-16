import { chromium } from "playwright";

interface ScreenshotServiceErrorOptions {
  statusCode: number;
}

export class ScreenshotServiceError extends Error {
  public readonly statusCode: number;

  constructor(message: string, options: ScreenshotServiceErrorOptions) {
    super(message);
    this.name = "ScreenshotServiceError";
    this.statusCode = options.statusCode;
  }
}

const SCREENSHOT_SELECTOR = "#comparisonCard";

export const generateUnitedFinancialComparisonScreenshot = async (
  html: string
): Promise<Buffer> => {
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 1400, height: 1200 }
    });

    await page.setContent(html, { waitUntil: "networkidle" });
    const comparisonCard = await page.waitForSelector(SCREENSHOT_SELECTOR, {
      state: "visible",
      timeout: 5000
    });

    if (!comparisonCard) {
      throw new ScreenshotServiceError("Comparison card was not found", {
        statusCode: 422
      });
    }

    const screenshotBuffer = await comparisonCard.screenshot({ type: "png" });
    return screenshotBuffer;
  } catch (error) {
    if (error instanceof ScreenshotServiceError) {
      throw error;
    }

    throw new ScreenshotServiceError("Unable to generate comparison image", {
      statusCode: 500
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

export const bufferToPngDataUrl = (imageBuffer: Buffer): string => {
  return `data:image/png;base64,${imageBuffer.toString("base64")}`;
};
