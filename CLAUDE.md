# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SophiaAI** is an intelligent real estate assistant supporting WhatsApp, Telegram, and email channels. It automates administrative tasks, document generation, property listings, and real estate calculations for Cyprus real estate agents.

- **Production URL**: https://sophia-agent.vercel.app
- **Framework**: Next.js 15.5.4 with App Router and Turbopack
- **Methodology**: BMAD (Business Model Agile Development)
- **Architecture**: Monorepo with npm workspaces and Turbo

## Development Commands

```bash
# From repository root (uses Turbo for monorepo orchestration):
npm run dev          # Start Next.js dev server across all workspaces
npm run build        # Build production bundle (all workspaces)
npm run test         # Run all tests with Vitest

# From apps/web:
npm run dev          # Start dev server with Turbopack on port 3000
npm run build        # Build production bundle with Turbopack
npm run test         # Run tests once
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run start        # Start production server

# From packages/services:
npm run test         # Run service tests
npm run test:watch   # Run service tests in watch mode

# Development utilities (in dev/scripts/):
node dev/scripts/apply-migrations.mjs        # Apply database migrations
node dev/scripts/setup-telegram-webhook.ts   # Configure Telegram webhook
node dev/scripts/check-agent.mjs            # Verify agent status
node dev/scripts/check-logs.mjs             # View conversation logs
node dev/scripts/check-recent-logs.mjs      # View recent conversation logs
node dev/scripts/test-webhook-local.mjs     # Test webhook locally
node dev/scripts/performance-comparison.mjs # Performance benchmarking

# Single test commands:
npm run test -- my-test-file.test.ts        # Run specific test file
npm run test:watch -- my-test-file.test.ts  # Watch specific test file

# System requirements:
# - Node.js v20.0.0+
# - npm v10.0.0+
```

## Directory Structure

**Organized for maintainability and clarity:**

```
sophiaai/
├── 📁 dev/                    # Development tools & utilities
│   ├── scripts/              # All .mjs/.ts development scripts
│   ├── tests/                # Test files outside packages
│   └── notes/                # Session notes and development logs
├── 📁 project/               # Project management & documentation
│   ├── summaries/            # EPIC reports, session reports
│   ├── deployment/           # Deployment documentation
│   └── knowledge/            # Knowledge Base templates
├── 📁 .config/               # Consolidated configuration
│   ├── claude/               # Claude AI configuration
│   ├── cursor/               # Cursor IDE rules
│   ├── codex/                # Codex settings
│   └── mcp/                  # MCP server configurations
├── 📁 apps/web/              # Next.js application (App Router)
├── 📁 packages/              # Shared packages
│   ├── services/             # Core business logic
│   ├── shared/               # Types, constants, utils
│   └── database/             # Supabase migrations
├── 📁 docs/                  # Documentation (sharded)
│   ├── architecture/         # System architecture (17+ files)
│   ├── prd/                  # Product requirements by epic
│   └── stories/              # Development tasks
└── 📁 Root essentials        # Clean root with only essential files
```

## Architecture

**Monorepo Structure** (npm workspaces with Turbo):

### Core Applications
- `apps/web/`: Next.js 15.5.4 app (App Router, Turbopack)
  - API routes in `src/app/api/` (whatsapp-webhook, telegram-webhook, admin, auth, health)
  - Path alias `@` resolves to `src/`

### Service Layer
- `packages/services/`: Core business logic (imported as `@sophiaai/services`)
  - `whatsapp.service.ts`: Meta Cloud API integration (NOT Baileys/Twilio)
  - `telegram.service.ts`: Telegram Bot API integration
  - `openai.service.ts`: AI response generation
  - `assistant.service.ts`: OpenAI Assistants API with thread management
  - `document.service.ts`: PDF generation and document handling
  - `calculator.service.ts`: Real estate calculations (mortgage, ROI, rental yield)
  - `rate-limiter.service.ts`: Upstash Redis-based rate limiting
  - `metrics.service.ts`: Performance monitoring
  - `document-optimized.service.ts`: Optimized document generation with caching
  - `template-cache.service.ts`: Template caching for performance
  - `template-intent.service.ts`: Template intent recognition
  - `template-optimizer.service.ts`: Template optimization
  - `performance-analytics.service.ts`: Performance tracking and analytics

### Shared Infrastructure
- `packages/shared/`: Shared types, errors, constants, utils (imported as `@sophiaai/shared`)
- `packages/database/`: Supabase migrations (numbered: `001_create_agents_table.sql`, etc.)

**Multi-Channel Request Flow**:
1. **WhatsApp**: Meta Cloud API webhook → `api/whatsapp-webhook/route.ts` → async processing → stores to `conversation_logs`
2. **Telegram**: Bot API webhook → `api/telegram-webhook/route.ts` → OpenAI Assistants API → response via TelegramService
3. **Email**: Gmail API integration for document sending and client communication
4. **AI Processing**: OpenAI Service or Assistants API for intelligent responses

## Database (Supabase)

**Project Details:**
- **Project ID**: `zmwgoagpxefdruyhkfoh` (sophia)
- **Region**: eu-north-1
- **Status**: ACTIVE_HEALTHY
- **PostgreSQL**: v17.6.1.011

**Database Tables** (RLS enabled):
- `agents`: Phone number, name, email, status (4 active agents)
- `conversation_logs`: Inbound/outbound messages (249 records)
- `document_generations`: PDF generation logs (41 records)
- `optimized_document_generations`: Enhanced document generation with performance tracking
- `admin_users`: Dashboard access with role-based permissions
- `calculators`: Real estate calculation tools (3 active)
- `telegram_users`: Telegram user mappings
- `message_forwards`: Cross-platform message routing
- `document_request_sessions`: Multi-turn document generation
- `calculator_history`: Calculation usage tracking
- `system_config`: Application configuration

**MCP Access**: Full Supabase MCP integration available for database operations.

## External Integrations

- **WhatsApp**: Meta Cloud API (official Business API)
- **Telegram**: Bot API with webhook support
- **Email**: Gmail API with OAuth authentication
- **AI**: OpenAI GPT-4o-mini and Assistants API
- **Documents**: @react-pdf/renderer for PDF generation
- **Caching**: Upstash Redis for rate limiting and sessions
- **Database**: Supabase (PostgreSQL) with RLS
- **Deployment**: Vercel with CI/CD pipeline

## Testing

- **Framework**: Vitest with jsdom environment
- **Location**: `__tests__/` directories adjacent to source files
- **Configuration**: `apps/web/vitest.config.ts`
- **Coverage**: React Testing Library for component tests
- **Requirements**: Tests must pass before marking BMAD stories complete

**Test Commands:**
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test -- my-test-file.test.ts

# Run tests for specific package
cd packages/services && npm run test
cd apps/web && npm run test
```

## Required Environment Variables

See `.env.example` for full list. Critical variables:

```bash
# Database
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# AI
OPENAI_API_KEY=sk-xxxxx
OPENAI_ASSISTANT_ID=asst_xxxxx  # For Telegram integration

# WhatsApp (Meta Cloud API, NOT Twilio)
WHATSAPP_BUSINESS_ACCOUNT_ID=xxxxx
WHATSAPP_ACCESS_TOKEN=xxxxx
WHATSAPP_WEBHOOK_VERIFY_TOKEN=xxxxx
WHATSAPP_PHONE_NUMBER_ID=xxxxx

# Telegram
TELEGRAM_BOT_TOKEN=xxxxx:xxxxx
TELEGRAM_WEBHOOK_SECRET=xxxxx

# Caching & Rate Limiting
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx

# Authentication
NEXTAUTH_SECRET=xxxxx
NEXTAUTH_URL=https://sophia-agent.vercel.app

# Monitoring (optional)
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

**IMPORTANT**: WhatsApp uses Meta Cloud API (official), NOT Twilio or @whiskeysockets/baileys.

## BMAD Workflow

BMAD configuration is in `.bmad-core/core-config.yaml`. The methodology uses markdown explosion for sharded docs.

1. **Check current story**: Review `docs/stories/*.story.md` for active work
2. **Follow acceptance criteria**: Each story has specific criteria and dev notes
3. **Use existing services**: Import from `@sophiaai/services` and `@sophiaai/shared` rather than rewriting
4. **Database migrations**: All schema changes go in `packages/database/supabase/migrations/` with sequential numbering (`001_`, `002_`, etc.)
5. **Use Supabase MCP**: For database operations, use connected MCP tools
6. **Update docs**: Sync `docs/architecture/` (sharded) and `docs/prd/` (sharded) with implementation changes
7. **Always load**: `docs/architecture/coding-standards.md`, `tech-stack.md`, `source-tree.md`

## Coding Standards

- **TypeScript**: Strict mode enabled with `noUncheckedIndexedAccess`
- **Naming**: kebab-case files, PascalCase types/components, camelCase functions, UPPER_SNAKE_CASE constants, snake_case DB tables
- **Commits**: Conventional Commits format (`feat(scope):`, `fix(scope):`, `docs(scope):`)
- **Testing**: Tests in `__tests__/` directories; must pass before marking stories complete
- **Imports**: Use workspace aliases `@sophiaai/services` and `@sophiaai/shared`

## Performance Requirements

- Response latency: <2s (simple), <5s (complex)
- Concurrency: 100 agents, 20 concurrent conversations
- Throughput: 300+ messages/hour
- Uptime: 99% (8 AM - 8 PM Cyprus time)

## Deployment

**Vercel Configuration:**
- **Project**: sophia-agent → https://sophia-agent.vercel.app
- **CLI**: Fully configured and accessible via `vercel` command
- **Auto-deploy**: Main branch deploys to production automatically
- **Preview Deployments**: Available for all pull requests
- **Environment**: Configure in Vercel dashboard

**Key Deployment Commands:**
```bash
vercel list              # View all deployments
vercel logs              # View production logs
vercel env ls            # List environment variables
vercel --prod           # Deploy to production
```

## Key Files to Know

### Core Services
- `packages/services/src/whatsapp.service.ts` - Meta Cloud API integration
- `packages/services/src/telegram.service.ts` - Telegram Bot API integration
- `packages/services/src/assistant.service.ts` - OpenAI Assistants API with threads
- `packages/services/src/document.service.ts` - PDF generation and document handling

### API Handlers
- `apps/web/src/app/api/whatsapp-webhook/route.ts` - WhatsApp webhook handler
- `apps/web/src/app/api/telegram-webhook/route.ts` - Telegram webhook handler

### Database & Configuration
- `packages/database/supabase/migrations/` - Sequential SQL migrations
- `docs/architecture/` - Sharded architecture docs (17+ files)
- `docs/prd/` - Sharded PRD by epic
- `.bmad-core/core-config.yaml` - BMAD methodology configuration
- `turbo.json` - Monorepo build pipeline config

### Development Tools
- `dev/scripts/` - Development utilities and scripts
  - `apply-migrations.mjs` - Apply database migrations automatically
  - `check-agent.mjs` - Verify agent status in database
  - `check-logs.mjs` - View conversation logs
  - `setup-telegram-webhook.ts` - Configure Telegram webhook
- `project/summaries/` - EPIC summaries and session reports
- `project/deployment/` - Deployment documentation
- `.config/mcp/` - MCP server configurations

### Performance Optimization
- `packages/services/src/document-optimized.service.ts` - Optimized document generation
- `packages/services/src/template-cache.service.ts` - Template caching
- `packages/services/src/performance-analytics.service.ts` - Performance tracking
- Migration `020_create_optimized_document_generations_table.sql` - Performance monitoring table
