import { crawlUrl } from "./crawl-service.js";
import { writeFile, mkdir } from "fs/promises";

const OUTPUT_DIR = process.env.OUTPUT_DIR || "./output";

// Get URL from command line
const url = process.argv[2];

if (!url) {
  console.error("Usage: npm run crawl <url>");
  process.exit(1);
}

crawlUrl(url)
  .then(async (results) => {
    // Ensure output directory exists
    await mkdir(OUTPUT_DIR, { recursive: true });

    // Save screenshot as file
    if (results.screenshot) {
      const screenshotBuffer = Buffer.from(results.screenshot, "base64");
      await writeFile(`${OUTPUT_DIR}/screenshot.jpg`, screenshotBuffer);
      console.log(`Screenshot saved to ${OUTPUT_DIR}/screenshot.jpg`);
    }

    // Save results (without base64 screenshot in JSON for readability)
    const resultsForFile = {
      url: results.url,
      statusCode: results.statusCode,
      metadata: results.metadata,
      readableContent: results.readableContent?.substring(0, 500) + "...",
      htmlContentLength: results.htmlContentLength,
    };

    await writeFile(
      `${OUTPUT_DIR}/crawl-results.json`,
      JSON.stringify(resultsForFile, null, 2)
    );
    console.log(`Results saved to ${OUTPUT_DIR}/crawl-results.json`);

    if (results.readableContent) {
      await writeFile(`${OUTPUT_DIR}/readable-content.html`, results.readableContent);
      console.log(`Readable content saved to ${OUTPUT_DIR}/readable-content.html`);
    }

    console.log("\n=== Crawl Complete ===");
    console.log(JSON.stringify(resultsForFile, null, 2));
  })
  .catch((error) => {
    console.error("Error crawling page:", error);
    process.exit(1);
  });
