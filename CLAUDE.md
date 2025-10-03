# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sophia** is an intelligent WhatsApp-based AI assistant for Cyprus real estate agents at zyprus.com. It automates administrative tasks, document generation, property listing uploads, and real estate calculations through conversational WhatsApp interface.

- **Production URL**: https://sophia-agent.vercel.app
- **Status**: Epic 1 Complete (6/6 stories), deployed and operational
- **Methodology**: BMAD (Business Model Agile Development)

## Development Commands

```bash
# From repository root:
npm run dev      # Start Next.js dev server (apps/web)
npm run build    # Build production bundle
npm run test     # Run all tests with Vitest

# From apps/web:
npm run dev          # Start dev server with Turbopack
npm run test         # Run tests once
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint

# From packages/services:
npm run test         # Run service tests
npm run test:watch   # Run service tests in watch mode
```

## Architecture

**Monorepo Structure** (npm workspaces):
- `apps/web/`: Next.js 15.5.4 app (App Router, Turbopack)
  - API routes in `src/app/api/`
  - Path alias `@` resolves to `src/`
- `packages/services/`: Core business logic
  - `whatsapp.service.ts`: Twilio integration, retry logic (exponential backoff), rate limiting (80 msg/sec)
  - `openai.service.ts`: AI response generation (3s timeout)
- `packages/shared/`: Shared types and utilities
- `packages/database/`: Supabase migrations and schemas

**Key Request Flow**:
1. Twilio webhook → `apps/web/src/app/api/whatsapp-webhook/route.ts`
2. Async message processing → stores to `conversation_logs` table
3. OpenAI generates response → WhatsAppService sends message

**Database Tables** (Supabase):
- `agents`: Phone number, name, email, status
- `conversation_logs`: Inbound/outbound messages with delivery tracking

## Testing

- **Framework**: Vitest
- **Location**: `__tests__/` directories adjacent to source files
- **Config**: `apps/web/vitest.config.ts`
- Tests must pass before marking BMAD stories complete

## Required Environment Variables

```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_WHATSAPP_NUMBER
```

## BMAD Workflow

1. **Check current story**: Review `docs/stories/*.story.md` for active work
2. **Follow acceptance criteria**: Each story has specific criteria and dev notes
3. **Use existing services**: Import from `@sophiaai/services` and `@sophiaai/shared` rather than rewriting
4. **Database migrations**: All schema changes go in `packages/database/supabase/migrations/`
5. **Use Supabase MCP**: For database operations, use connected MCP tools
6. **Update docs**: Sync `docs/architecture/` and `docs/prd.md` with implementation changes

## Performance Requirements

- Response latency: <2s (simple), <5s (complex)
- Concurrency: 100 agents, 20 concurrent conversations
- Throughput: 300+ messages/hour
- Uptime: 99% (8 AM - 8 PM Cyprus time)

## Key Architecture Files

- `packages/services/src/whatsapp.service.ts` - Twilio WhatsApp integration
- `packages/services/src/openai.service.ts` - AI response generation
- `apps/web/src/app/api/whatsapp-webhook/route.ts` - Main webhook handler
- `packages/database/supabase/migrations/` - Database schema versions
- `docs/prd.md` - Product requirements
- `docs/architecture/tech-stack.md` - System architecture
- `.bmad-core/core-config.yaml` - BMAD configuration
