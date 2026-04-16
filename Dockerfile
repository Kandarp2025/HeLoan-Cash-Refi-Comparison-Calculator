# Build stage: compile TypeScript using the full Playwright image so dev tooling
# has the same base as the runtime stage.
FROM mcr.microsoft.com/playwright:v1.59.1-jammy AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Runtime stage: Playwright image already ships Chromium and the Linux libs it
# needs, so we only add production node_modules and the compiled output.
FROM mcr.microsoft.com/playwright:v1.59.1-jammy

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

CMD ["node", "dist/server.js"]
