# 13. Development Workflow

## 13.1 Prerequisites

- Node.js v20.x or later
- npm v9.x or later
- Git
- Docker Desktop (for local Redis)
- Supabase CLI (`npm install -g supabase`)
- Vercel CLI (`npm install -g vercel`)
- ngrok (for webhook testing)

## 13.2 Initial Setup

```bash
# Clone repository
git clone <repo-url>
cd sophiaai

# Install all dependencies (root + workspaces)
npm install

# Copy environment template
cp .env.example .env.local

# Start local Supabase (Docker)
supabase start

# Run database migrations
npm run db:migrate

# Seed development data
npm run db:seed

# Start local Redis (Docker)
docker run -d -p 6379:6379 redis:7-alpine

# Start development server
npm run dev
```

## 13.3 Development Commands

```json
{
  "scripts": {
    "dev": "npm run dev:redis && npm run dev:web",
    "dev:web": "cd apps/web && npm run dev",
    "dev:redis": "docker start sophiaai-redis || docker run -d --name sophiaai-redis -p 6379:6379 redis:7-alpine",

    "build": "npm run build --workspaces",
    "build:web": "cd apps/web && npm run build",

    "test": "npm run test --workspaces",
    "test:watch": "npm run test:watch --workspaces",
    "test:e2e": "cd apps/web && npm run test:e2e",

    "db:migrate": "cd packages/database && npm run migrate",
    "db:seed": "cd packages/database && npm run seed",
    "db:reset": "supabase db reset",

    "lint": "npm run lint --workspaces",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\"",

    "webhook:tunnel": "ngrok http 3000",
    "webhook:test": "node scripts/test-webhook.js"
  }
}
```

## 13.4 Webhook Development

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Start ngrok tunnel
ngrok http 3000

# Copy HTTPS URL: https://<random>.ngrok.io
# Configure in Meta Developer Console:
# Webhook URL: https://<random>.ngrok.io/api/webhooks/whatsapp
# Verify Token: <WHATSAPP_WEBHOOK_VERIFY_TOKEN>
```

---
