FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Default command (can be overridden)
CMD ["npm", "run", "crawl", "https://example.com"]
