import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { crawlUrl } from "./crawl-service.js";

const app = new Hono();

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

app.post("/crawl", async (c) => {
  const body = await c.req.json();
  const url = body.url;

  if (!url) {
    return c.json({ error: "URL is required" }, 400);
  }

  try {
    const result = await crawlUrl(url);
    return c.json(result);
  } catch (error) {
    console.error("Crawl error:", error);
    return c.json(
      {
        error: "Failed to crawl URL",
        message: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

app.get("/crawl", async (c) => {
  const url = c.req.query("url");

  if (!url) {
    return c.json({ error: "URL query parameter is required" }, 400);
  }

  try {
    const result = await crawlUrl(url);
    return c.json(result);
  } catch (error) {
    console.error("Crawl error:", error);
    return c.json(
      {
        error: "Failed to crawl URL",
        message: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

const port = 3010;

console.log(`Starting crawler server on port ${port}...`);
serve({
  fetch: app.fetch,
  port,
});

console.log(`Crawler server running at http://localhost:${port}`);
console.log(`Health check: http://localhost:${port}/health`);
console.log(`Crawl endpoint: POST http://localhost:${port}/crawl with {"url": "..."}`);
console.log(`Crawl endpoint: GET http://localhost:${port}/crawl?url=...`);
