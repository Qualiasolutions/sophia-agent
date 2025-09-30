# 12. Unified Project Structure

```
sophiaai/
├── .github/
│   └── workflows/
│       ├── deploy.yml                  # CI/CD pipeline
│       └── test.yml                    # Test suite
├── .husky/
│   ├── pre-commit                      # Run lint-staged + tests
│   └── commit-msg                      # Validate commit messages
├── apps/
│   └── web/
│       ├── public/                     # Static assets
│       ├── src/
│       │   ├── app/                    # Next.js App Router
│       │   │   ├── (auth)/
│       │   │   ├── (dashboard)/
│       │   │   ├── api/
│       │   │   ├── layout.tsx
│       │   │   └── page.tsx
│       │   ├── components/             # React components
│       │   │   ├── ui/
│       │   │   ├── agents/
│       │   │   ├── conversations/
│       │   │   └── ...
│       │   ├── server/                 # tRPC routers
│       │   │   ├── api/
│       │   │   │   ├── routers/
│       │   │   │   ├── root.ts
│       │   │   │   └── trpc.ts
│       │   │   └── auth.ts
│       │   ├── stores/                 # Zustand stores
│       │   ├── styles/                 # Global styles
│       │   ├── trpc/                   # tRPC client
│       │   └── middleware.ts           # Next.js middleware
│       ├── .env.example
│       ├── .env.local
│       ├── next.config.mjs
│       ├── package.json
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── vitest.config.ts
├── packages/
│   ├── services/
│   │   ├── src/
│   │   │   ├── conversation.service.ts
│   │   │   ├── document.service.ts
│   │   │   ├── listing.service.ts
│   │   │   ├── calculator.service.ts
│   │   │   ├── email.service.ts
│   │   │   ├── whatsapp.service.ts
│   │   │   ├── telegram.service.ts
│   │   │   ├── openai.service.ts
│   │   │   └── monitoring/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── shared/
│   │   ├── src/
│   │   │   ├── types/
│   │   │   ├── errors/
│   │   │   ├── constants/
│   │   │   └── utils/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── database/
│   │   ├── supabase/
│   │   │   ├── migrations/
│   │   │   └── seed.sql
│   │   ├── scripts/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── config/
│       ├── eslint-config/
│       ├── typescript-config/
│       └── package.json
├── docs/
│   ├── architecture.md                 # This document
│   ├── prd.md
│   └── brief.md
├── .eslintrc.json
├── .gitignore
├── .prettierrc
├── commitlint.config.js
├── package.json                        # Workspace root
├── pnpm-workspace.yaml
├── README.md
└── tsconfig.json                       # Root TypeScript config
```

## Import Path Mapping

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./apps/web/src/*"],
      "@sophiaai/services": ["./packages/services/src"],
      "@sophiaai/shared": ["./packages/shared/src"]
    }
  }
}
```

## Environment Variables

```bash
# .env.example

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx

# OpenAI
OPENAI_API_KEY=sk-xxxxx

# WhatsApp (Meta Cloud API)
WHATSAPP_BUSINESS_ACCOUNT_ID=xxxxx
WHATSAPP_ACCESS_TOKEN=xxxxx
WHATSAPP_WEBHOOK_VERIFY_TOKEN=xxxxx
WHATSAPP_PHONE_NUMBER_ID=xxxxx

# Telegram
TELEGRAM_BOT_TOKEN=xxxxx:xxxxx

# Gmail (OAuth)
GMAIL_CLIENT_ID=xxxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=xxxxx
GMAIL_REDIRECT_URI=https://app.sophiaai.com/api/auth/gmail/callback

# zyprus.com API (BLOCKED)
ZYPRUS_API_KEY=xxxxx
ZYPRUS_API_BASE_URL=https://api.zyprus.com

# Next.js
NEXTAUTH_URL=https://app.sophiaai.com
NEXTAUTH_SECRET=xxxxx

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Vercel (auto-populated)
VERCEL_ENV=production
VERCEL_GIT_COMMIT_SHA=xxxxx
VERCEL_REGION=iad1
```

---
