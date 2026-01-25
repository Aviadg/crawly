#!/bin/bash

# Test script for the crawler HTTP server

URL="${1:-https://v2.travelark.org/travel-blog-entry/naxxer/1/1339977600}"

echo "Testing crawler server at http://localhost:3010"
echo "URL: $URL"
echo ""

echo "=== Health Check ==="
curl -s http://localhost:3010/health | jq .
echo ""

echo "=== Crawling (this may take a few seconds) ==="
curl -s -X POST http://localhost:3010/crawl \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$URL\"}" | jq '{
    url,
    statusCode,
    metadata: {
      title,
      description,
      author,
      publisher,
      image,
      logo
    },
    readableContentLength: (.readableContent | length),
    screenshotSize: (.screenshot | length),
    htmlContentLength
  }'

echo ""
echo "Done! Full response saved to /tmp/crawl-response.json"

curl -s -X POST http://localhost:3010/crawl \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$URL\"}" > /tmp/crawl-response.json
