# united-financial-render-service

Small Node.js + TypeScript backend service scaffold for rendering-related APIs.

## Stack

- Express.js
- TypeScript (strict mode)
- dotenv
- cors
- helmet
- morgan
- ts-node-dev

## Project Structure

```text
src/
  app.ts
  server.ts
  routes/
  controllers/
  services/
  shared/
  templates/
  utils/
  config/
  middleware/
  types/
```

## Setup

1. Install dependencies:
   - `npm install`
2. Copy env example:
   - `copy .env.example .env` (Windows)
   - or `cp .env.example .env` (macOS/Linux)
3. Start in development:
   - `npm run dev`

## Scripts

- `npm run dev`: Run with hot reload using ts-node-dev
- `npm run build`: Compile TypeScript into `dist/`
- `npm start`: Run compiled server from `dist/server.js`

## Routes

- `GET /health` - Returns service health status
- `POST /api/united-financial/validate-only` - Validates calculator input payload and returns sanitized data
- `POST /api/united-financial/calculate` - Validates payload and returns raw-number comparison results
- `POST /api/united-financial/render-html` - Validates payload, calculates comparison, and returns HTML card markup
