import { chromium } from "playwright";

interface HtmlRenderErrorOptions {
  statusCode: number;
}

export class HtmlRenderError extends Error {
  public readonly statusCode: number;

  constructor(message: string, options: HtmlRenderErrorOptions) {
    super(message);
    this.name = "HtmlRenderError";
    this.statusCode = options.statusCode;
  }
}

const RENDER_WIDTH = 1080;

export const renderComparisonHtmlToImageBuffer = async (
  html: string
): Promise<Buffer> => {
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: RENDER_WIDTH, height: 520 }
    });

    await page.setContent(html, { waitUntil: "networkidle" });

    // Resize the viewport to fit the rendered content so the screenshot
    // has no excess whitespace below the card.
    const contentHeight = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      return Math.ceil(
        Math.max(
          body.scrollHeight,
          body.offsetHeight,
          html.clientHeight,
          html.scrollHeight,
          html.offsetHeight
        )
      );
    });

    await page.setViewportSize({
      width: RENDER_WIDTH,
      height: Math.max(contentHeight, 1)
    });

    const screenshotBuffer = await page.screenshot({ type: "png" });

    return screenshotBuffer;
  } catch (error) {
    if (error instanceof HtmlRenderError) {
      throw error;
    }
    throw new HtmlRenderError("Unable to render HTML to image", {
      statusCode: 500
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
