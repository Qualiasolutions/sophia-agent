# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SophiaAI** is an intelligent real estate assistant supporting WhatsApp, Telegram, and email channels. It automates administrative tasks, document generation, property listings, and real estate calculations for Cyprus real estate agents.

- **Production URL**: https://sophia-agent.vercel.app
- **Framework**: Next.js 15.5.4 with App Router and Turbopack
- **Methodology**: BMAD (Business Model Agile Development)
- **Architecture**: Monorepo with npm workspaces and Turbo
- **Package Manager**: npm 10.9.2
- **Engines**: Node.js 20.0.0+, npm 10.0.0+
- **Testing**: Vitest with jsdom environment, React Testing Library
- **Database**: Supabase (PostgreSQL) with RLS enabled
- **AI**: OpenAI GPT-4o-mini and Assistants API

## Development Commands

```bash
# From repository root (uses Turbo for monorepo orchestration):
npm run dev          # Start Next.js dev server across all workspaces
npm run build        # Build production bundle (all workspaces)
npm run test         # Run all tests with Vitest

# From apps/web:
npm run dev          # Start dev server with Turbopack on port 3000
npm run build        # Build production bundle with Turbopack
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run tests once
npm run test:watch   # Run tests in watch mode

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
node dev/scripts/test-agent-lookup.mjs      # Test agent lookup functionality
node dev/scripts/load-templates.mjs         # Load document templates

# Single test commands:
npm run test -- my-test-file.test.ts        # Run specific test file
npm run test:watch -- my-test-file.test.ts  # Watch specific test file
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
│       └── Templates/        # Document templates
│           └── Registeration Forms/
│               ├── reg_final/ # Optimized registration instructions (11 files)
│               ├── Reg_ to Owners.docx
│               ├── Reg_Banks.docx
│               ├── Reg_Developers_.docx
│               └── Registrations multiple sellers .docx
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
   - Handles delivery status updates from Meta Cloud API
   - Uses OpenAI service for chat responses and OptimizedDocumentService for document generation
   - Includes calculator service integration for real estate calculations
2. **Telegram**: Bot API webhook → `api/telegram-webhook/route.ts` → OpenAI Service → response via TelegramService
   - User registration flow with email verification
   - Message forwarding to WhatsApp capability
   - Rate limiting and metrics tracking
3. **Email**: Gmail API integration for document sending and client communication
4. **AI Processing**: OpenAI Service or OptimizedDocumentService for intelligent responses

## Database (Supabase)

**Project Details:**
- **Project ID**: `zmwgoagpxefdruyhkfoh` (sophia)
- **Region**: eu-north-1
- **Status**: ACTIVE_HEALTHY
- **PostgreSQL**: v17.6.1.011

**Database Tables** (RLS enabled):
- `agents`: Phone number, name, email, status (4 active agents)
- `conversation_logs`: Inbound/outbound messages with delivery status tracking
- `document_generations`: PDF generation logs (41 records)
- `optimized_document_generations`: Enhanced document generation with performance tracking
- `admin_users`: Dashboard access with role-based permissions
- `calculators`: Real estate calculation tools (3 active)
- `telegram_users`: Telegram user mappings with agent associations
- `message_forwards`: Cross-platform message routing logs
- `document_request_sessions`: Multi-turn document generation sessions
- `calculator_history`: Calculation usage tracking
- `system_config`: Application configuration

**MCP Access**: Full Supabase MCP integration available for database operations.

**Migration Pattern**: Sequential numbering (`001_`, `002_`, etc.) in `packages/database/supabase/migrations/`

## External Integrations

- **WhatsApp**: Meta Cloud API (official Business API) - NOT Twilio or Baileys
- **Telegram**: Bot API with webhook support and user registration
- **Email**: Gmail API with OAuth authentication
- **AI**: OpenAI GPT-4o-mini and Assistants API
- **Documents**: @react-pdf/renderer for PDF generation
- **Caching**: Upstash Redis for rate limiting and sessions
- **Database**: Supabase (PostgreSQL) with RLS
- **Deployment**: Vercel with CI/CD pipeline
- **Real Estate Data**: Zyprus API integration for property information

## Testing

- **Framework**: Vitest with jsdom environment
- **Location**: `__tests__/` directories adjacent to source files
- **Configuration**: `apps/web/vitest.config.ts`
- **Coverage**: React Testing Library for component tests
- **Requirements**: Tests must pass before marking BMAD stories complete

**Test Commands:**
```bash
# Run all tests (from root)
npm run test

# Run tests in watch mode (from root)
npm run test:watch

# Run tests for specific workspace
cd apps/web && npm run test
cd packages/services && npm run test

# Run specific test file
npm run test -- my-test-file.test.ts

# Run specific test file in watch mode
npm run test:watch -- my-test-file.test.ts
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

# Zyprus API (Real Estate Data)
ZYPRUS_API_KEY=xxxxx
ZYPRUS_API_BASE_URL=xxxxx

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
7. **Always load**: `docs/architecture/17-coding-standards.md`, `3-tech-stack.md`, `12-unified-project-structure.md`

**Development Environment**:
- Use `node dev/scripts/apply-migrations.mjs` to apply database schema changes
- Use `node dev/scripts/check-agent.mjs` to verify agent status in database
- Use `node dev/scripts/setup-telegram-webhook.ts` to configure Telegram webhook
- Test locally with `node dev/scripts/test-webhook-local.mjs`

## Coding Standards

**TypeScript Configuration**:
- Strict mode enabled with `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`

**Naming Conventions**:
- Files: kebab-case (`conversation.service.ts`)
- Interfaces/Types: PascalCase (`Agent`, `ConversationState`)
- Functions: camelCase (`processMessage()`)
- Constants: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- React Components: PascalCase (`AgentCard`)
- Database Tables: snake_case (`agents`, `conversation_messages`)

**Commits**: Conventional Commits format (`feat(agents):`, `fix(webhooks):`, `docs(architecture):`, `test(api):`)

**Testing**: Tests in `__tests__/` directories; must pass before marking stories complete

**Imports**: Use workspace aliases `@sophiaai/services` and `@sophiaai/shared`

## Document Generation & Registration System

**Registration Document Templates:**
The system uses optimized instruction files located in `project/knowledge/Knowledge Base/Templates/Registeration Forms/reg_final/`

### Registration Flow (Updated)
Sophia now follows a structured 4-step flow for all registration requests:

1. **Category Selection**: Ask if registration is for Seller/Owner, Developer, or Bank
2. **Type Selection**: Within each category, ask for specific type (Standard, Marketing, Rental, etc.)
3. **Multiple Sellers Check**: Confirm if registration is for multiple co-owners
4. **Information Collection**: Collect ALL required fields before generating

### Available Registration Types
- **Standard Seller Registration** (01) - Regular property registrations
- **Seller with Marketing Agreement** (02) - Riskier cases with marketing terms
- **Rental Property Registration** (03) - Landlord/tenant registrations
- **Advanced Seller Registration** (04) - Multiple properties/special terms
- **Bank Property Registration** (05) - Bank-owned properties (REMU, Gordian, etc.)
- **Bank Land Registration** (06) - Bank-owned land (requires viewing form)
- **Developer Registration - Viewing** (07) - With scheduled viewing
- **Developer Registration - No Viewing** (08) - Without viewing scheduled
- **Multiple Sellers Clause** (09) - Add-on for co-owners

### Key Features
- **Complete Information Collection**: Sophia won't generate until ALL required fields provided
- **Exact Format Copy-Paste**: Documents match professional templates exactly
- **Subject Line Separation**: Sent in separate message for clarity
- **Phone Number Masking**: Auto-masks middle digits (99 ** 67 32)
- **Template Instructions**: Each registration type has detailed instruction file

### Integration
- Template definitions in `packages/shared/src/types/document-templates.ts`
- Optimized document generation via `packages/services/src/document-optimized.service.ts`
- Template caching for performance via `packages/services/src/template-cache.service.ts`

## Performance Requirements

- Response latency: <2s (simple), <5s (complex)
- Concurrency: 100 agents, 20 concurrent conversations
- Throughput: 300+ messages/hour
- Uptime: 99% (8 AM - 8 PM Cyprus time)

## Monitoring and Debugging

**Performance Monitoring**:
- `packages/services/src/performance-analytics.service.ts` - Performance tracking
- `packages/services/src/document-optimized.service.ts` - Optimized document generation
- `packages/services/src/template-cache.service.ts` - Template caching

**Health Check Endpoint**: `/api/health` - Returns application status and environment info

**Error Tracking**: Sentry integration for production error monitoring

## Workspace Configuration

**Turbo Configuration**:
- Build pipeline uses `turbo.json` for workspace orchestration
- Environment variables for builds are explicitly defined in turbo config
- Persistent dev server for local development
- No caching for tests to ensure fresh results

**Package Dependencies**:
- `apps/web` imports `@sophiaai/services` and `@sophiaai/shared` as workspace dependencies
- Services are transpiled by Next.js at build time, no separate build step needed
- All packages share TypeScript configuration through root-level setup

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
