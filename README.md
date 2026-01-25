# Crawly 🕷️

> **Attribution:** This project is extracted and adapted from [Karakeep](https://github.com/karakeep-app/karakeep)'s production-tested web crawler implementation. The core crawling logic, metadata extraction pipeline, and Chrome DevTools Protocol integration are based on their excellent open-source codebase.

A web crawler HTTP service with screenshot capture, metadata extraction, and readable content parsing.

Built with:
- **Playwright** - Headless Chrome automation
- **Metascraper** - Platform-specific metadata extraction (YouTube, Amazon, Reddit, Twitter/X)
- **Mozilla Readability** - Article content extraction
- **Hono** - Lightweight HTTP server

## Features

- ✅ **Full page rendering** - JavaScript-heavy sites work perfectly
- ✅ **Screenshot capture** - Returns base64-encoded JPEG
- ✅ **Rich metadata** - Title, description, author, dates, Open Graph tags
- ✅ **Platform extractors** - Optimized for YouTube, Amazon, Reddit, Twitter/X
- ✅ **Readable content** - Clean HTML extraction with Mozilla Readability
- ✅ **Docker-ready** - Complete Docker Compose setup
- ✅ **HTTP API** - Simple REST API on port 3010

## Quick Start

```bash
# Start services
docker compose up -d

# Test the crawler
curl -X POST http://localhost:3010/crawl \
  -H "Content-Type: application/json" \
  -d '{"url": "https://news.ycombinator.com"}'
```

## API Endpoints

### `POST /crawl`
**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "url": "https://example.com",
  "statusCode": 200,
  "metadata": {
    "title": "Example Domain",
    "description": "Example description...",
    "author": "John Doe",
    "publisher": "Example.com",
    "datePublished": "2024-01-15T10:30:00Z",
    "dateModified": "2024-01-20T14:22:00Z",
    "image": "https://example.com/og-image.jpg",
    "logo": "https://example.com/favicon.png",
    "url": "https://example.com"
  },
  "readableContent": "<article><p>Clean HTML content...</p></article>",
  "htmlContentLength": 45678,
  "screenshot": "/9j/4AAQSkZJRgABAQAAAQABAAD..."
}
```

### `GET /crawl?url=<url>`
Same as POST but via query parameter.

### `GET /health`
Health check endpoint.
```json
{"status": "ok"}
```

## Platform-Specific Extractors

### YouTube
- Video title, channel, views, duration
- Upload date, description
- High-quality thumbnails

### Amazon
- Product title, price, ratings
- ASIN, brand information
- High-res product images (improved extractor fixes Prime logo bug)

### Reddit
- Post title, author, subreddit
- Creation date, post content
- Preview images from Reddit's CDN

### Twitter/X
- Tweet text, author
- Timestamps, profile images
- Thread context

## CLI Usage

You can also use it as a CLI tool:

```bash
# Crawl a URL and save to ./output/
docker-compose run --rm crawler npm run crawl https://example.com

# Check output files
ls -lh output/
# screenshot.jpg
# crawl-results.json
# readable-content.html
```

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `CHROME_HTTP_URL` | `http://localhost:9222` | Chrome DevTools Protocol endpoint |
| `OUTPUT_DIR` | `./output` | Output directory for CLI mode |

## Development

**Install dependencies:**
```bash
npm install
```

**Run server locally:**
```bash
# Start Chrome
docker-compose up -d chrome

# Run server
npm run server
```

## Testing

**Test script:**
```bash
./test-server.sh https://example.com
```

**Manual test:**
```bash
# Health check
curl http://localhost:3010/health

# Crawl a page
curl -X POST http://localhost:3010/crawl \
  -H "Content-Type: application/json" \
  -d '{"url": "https://news.ycombinator.com"}' \
  | jq .
```

## Architecture

```
┌─────────────────┐
│  HTTP Server    │  Port 3010
│  (Hono)         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Crawl Service  │
│  (Playwright)   │───── http://chrome:9222 (CDP)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Chrome         │
│  (Alpine)       │
└─────────────────┘
```

## How It Works

1. **Browser Connection** - Connects to Chrome via CDP, resolves DNS to bypass Host header restrictions
2. **Page Load** - Navigates with Playwright, blocks audio/video to save bandwidth
3. **Content Extraction**:
   - Metascraper extracts metadata (with platform-specific plugins)
   - Mozilla Readability extracts clean article content
   - DOMPurify sanitizes HTML
4. **Screenshot** - Captures JPEG screenshot at 80% quality
5. **Response** - Returns JSON with base64-encoded screenshot

## Production Considerations

- **Timeouts**: 30s navigation, 5s network idle
- **Resource Blocking**: Audio/video automatically blocked
- **Memory**: Chrome uses ~2GB shared memory
- **Concurrency**: Single browser instance, configure via `docker-compose.yml`
- **Rate Limiting**: Not included - add your own middleware if needed

## License

MIT

## Credits

Built on top of:
- [Karakeep](https://github.com/karakeep-app/karakeep) - Original crawler implementation
- [Playwright](https://playwright.dev/) - Browser automation
- [Metascraper](https://metascraper.js.org/) - Metadata extraction
- [Mozilla Readability](https://github.com/mozilla/readability) - Content extraction
