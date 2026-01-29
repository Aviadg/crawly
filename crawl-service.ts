import { chromium as playwrightChromium } from "playwright";
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Readability } from "@mozilla/readability";
import { JSDOM, VirtualConsole } from "jsdom";
import DOMPurify from "dompurify";
import metascraper from "metascraper";
import metascraperAmazon from "metascraper-amazon";
import metascraperAuthor from "metascraper-author";
import metascraperDate from "metascraper-date";
import metascraperDescription from "metascraper-description";
import metascraperImage from "metascraper-image";
import metascraperLogo from "metascraper-logo-favicon";
import metascraperPublisher from "metascraper-publisher";
import metascraperTitle from "metascraper-title";
import metascraperUrl from "metascraper-url";
import metascraperX from "metascraper-x";
import metascraperYoutube from "metascraper-youtube";
import * as dns from "dns/promises";
import metascraperAmazonImproved from "./metascraper-plugins/metascraper-amazon-improved.js";
import metascraperRedditSimple from "./metascraper-reddit-simple.js";

chromium.use(StealthPlugin());

const CHROME_HTTP_URL = process.env.CHROME_HTTP_URL || "http://localhost:9222";

const metascraperParser = metascraper([
  metascraperDate({
    dateModified: true,
    datePublished: true,
  }),
  metascraperAmazonImproved(),
  metascraperAmazon(),
  metascraperYoutube(),
  metascraperRedditSimple(),
  metascraperAuthor(),
  metascraperPublisher(),
  metascraperTitle(),
  metascraperDescription(),
  metascraperX(),
  metascraperImage(),
  metascraperLogo(),
  metascraperUrl(),
]);

export interface CrawlResult {
  url: string;
  statusCode?: number;
  metadata: any;
  readableContent: string | null;
  htmlContentLength: number;
  screenshot?: string; // base64
}

export async function crawlUrl(url: string): Promise<CrawlResult> {
  console.log(`Connecting to browser at ${CHROME_HTTP_URL}...`);

  const webUrl = new URL(CHROME_HTTP_URL);
  const { address } = await dns.lookup(webUrl.hostname);
  webUrl.hostname = address;
  console.log(`Successfully resolved IP address: ${webUrl.toString()}`);

  const browser = await playwrightChromium.connectOverCDP(webUrl.toString(), {
    slowMo: 100,
    timeout: 30000,
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    });

    const page = await context.newPage();

    // Block audio/video resources
    await page.route("**/*", async (route) => {
      const request = route.request();
      const resourceType = request.resourceType();

      if (
        resourceType === "media" ||
        request.headers()["content-type"]?.includes("video/") ||
        request.headers()["content-type"]?.includes("audio/")
      ) {
        await route.abort("aborted");
        return;
      }

      await route.continue();
    });

    console.log(`Navigating to ${url}...`);
    const response = await page.goto(url, {
      timeout: 30000,
      waitUntil: "domcontentloaded",
    });

    console.log(`Page loaded with status: ${response?.status()}`);

    // Wait for network idle or timeout
    await Promise.race([
      page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => ({})),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ]);

    console.log("Extracting content...");
    const htmlContent = await page.content();

    // Extract metadata
    console.log("Extracting metadata...");
    const meta = await metascraperParser({
      url,
      html: htmlContent,
      validateUrl: false,
    });

    // Extract readable content
    console.log("Extracting readable content...");
    const virtualConsole = new VirtualConsole();
    const dom = new JSDOM(htmlContent, { url, virtualConsole });
    let readableContent = null;

    try {
      const purifyWindow = new JSDOM("").window;
      try {
        const purify = DOMPurify(purifyWindow);

        // Platform-specific extraction for Twitter/X
        if (url.includes("twitter.com") || url.includes("x.com")) {
          const tweetElement = dom.window.document.querySelector(
            '[data-testid="tweetText"]'
          );
          if (tweetElement) {
            console.log("Extracted tweet using data-testid selector");
            readableContent = purify.sanitize(tweetElement.innerHTML);
          }
        }

        // Fallback to standard Readability if platform-specific failed
        if (!readableContent) {
          const readable = new Readability(dom.window.document).parse();
          if (readable && readable.content) {
            readableContent = purify.sanitize(readable.content);
          }
        }
      } finally {
        purifyWindow.close();
      }
    } finally {
      dom.window.close();
    }

    // Take screenshot
    console.log("Taking screenshot...");
    const screenshot = await page.screenshot({
      type: "jpeg",
      fullPage: false,
      quality: 80,
    });

    // Convert screenshot to base64
    const screenshotBase64 = screenshot.toString("base64");

    await context.close();

    return {
      url: page.url(),
      statusCode: response?.status(),
      metadata: meta,
      readableContent,
      htmlContentLength: htmlContent.length,
      screenshot: screenshotBase64,
    };
  } finally {
    await browser.close();
  }
}
