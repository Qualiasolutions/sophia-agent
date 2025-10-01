# Sophia AI - WhatsApp AI Agent for Cyprus Real Estate

## Project Overview

**Sophia** is an intelligent WhatsApp-based AI assistant designed for Cyprus real estate agents at zyprus.com. Built using the BMAD (Business Model Agile Development) methodology, Sophia automates administrative tasks, document generation, property listing uploads, and provides real estate calculations through a conversational WhatsApp interface.

## Current Development Status

**Current Story: 1.6 - End-to-End Conversation Flow (COMPLETE)**

### Completed Stories
- ✅ 1.1: Database Schema & Agent Registry
- ✅ 1.2: WhatsApp Business API Integration
- ✅ 1.3: Inbound Message Processing
- ✅ 1.4: OpenAI Response Generation
- ✅ 1.5: Outbound Message Delivery
- ✅ 1.6: End-to-End Conversation Flow (Deployed to Production)

### Production Deployment
- **Status:** ✅ Live and Operational
- **URL:** https://sophia-agent.vercel.app
- **Deployed:** 2025-10-01 16:30 UTC
- **Tests:** 28/28 passing (100%)
- **Health:** All endpoints healthy

## Tech Stack

### Core Technologies
- **Framework**: Next.js 15.5.4 (App Router, Turbopack)
- **Language**: TypeScript 5
- **Runtime**: Node.js >=20.0.0
- **Database**: Supabase (PostgreSQL)
- **AI/LLM**: OpenAI GPT
- **Messaging**: WhatsApp Business API (Twilio)

### Architecture
- **Monorepo Structure**: npm workspaces
  - `apps/web`: Next.js application with API routes
  - `packages/services`: Business logic (WhatsApp, OpenAI services)
  - `packages/shared`: Shared types and utilities
  - `packages/database`: Supabase migrations and schemas

### Key Services
- **WhatsAppService** (`packages/services/src/whatsapp.service.ts`): Handles message sending, retry logic with exponential backoff, rate limiting (80 msg/sec)
- **OpenAIService** (`packages/services/src/openai.service.ts`): AI response generation with 3-second timeout
- **Webhook Handler** (`apps/web/src/app/api/whatsapp-webhook/route.ts`): Async message processing pipeline

### Database Schema
1. **agents**: Agent registry (phone_number, name, email, status)
2. **conversation_logs**: All messages (inbound/outbound) with delivery tracking

### MCP Integrations
- ✅ **Supabase MCP**: Connected for database operations
- ✅ **Vercel CLI**: Connected for deployment

## BMAD Methodology

This project follows BMAD (Business Model Agile Development):
- Stories are in `docs/stories/` (currently 1.1 - 1.6)
- PRD: `docs/prd.md`
- Architecture: `docs/architecture/`
- BMAD agents configured in `.claude/commands/BMad/agents/`

## Key Features (Planned)

### Epic 1: Core WhatsApp Integration ✅ (Near Complete)
- Two-way WhatsApp communication
- Agent authentication
- AI-powered responses
- Conversation logging

### Epic 2: Document Generation (Next)
- Pre-built document templates
- Conversational data collection
- Template population and delivery

### Epic 3: Property Listing Upload
- Multi-turn listing creation flow
- Data validation
- zyprus.com platform integration

### Epic 4: Real Estate Calculators
- Mortgage calculator
- ROI calculator
- Commission calculator

### Epic 5: Email Management
- Gmail integration (sophia@zyprus.com)
- Email sending/forwarding via conversation

### Epic 6: Telegram Integration
- Basic Telegram bot
- Message forwarding

## Development Guidelines

### Testing
- Test framework: Vitest
- Run tests: `npm run test` (from apps/web)
- Integration tests in `__tests__/` directories

### Environment Variables
Required for development:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_NUMBER`

### Development Commands
```bash
npm run dev      # Start development server
npm run build    # Production build
npm run test     # Run tests
```

## Agent Instructions

### When Working on This Project

1. **Always check current story**: Review `docs/stories/1.6.story.md` to understand current work
2. **Follow BMAD structure**: Stories have acceptance criteria, tasks, and dev notes
3. **Use existing services**: Leverage WhatsAppService, OpenAIService rather than rewriting
4. **Test thoroughly**: Write tests in `__tests__/` before marking story complete
5. **Update docs**: Keep architecture and PRD docs in sync with implementation
6. **Use Supabase MCP**: For database operations, use the connected Supabase MCP tools
7. **Check migrations**: Database changes go in `packages/database/supabase/migrations/`

### Code Organization
- API routes: `apps/web/src/app/api/`
- Services: `packages/services/src/`
- Types: `packages/shared/src/types/`
- Tests: `__tests__/` directories adjacent to source

### Performance Requirements
- Response latency: <2s simple queries, <5s complex operations
- Support: 100 agents, 20 concurrent conversations
- Throughput: 300+ messages/hour
- Uptime: 99% during business hours (8 AM - 8 PM Cyprus time)

### Data Privacy
- GDPR compliant
- 90-day retention for conversations, documents, calculations
- 1-year retention for emails
- User data deletion on request

## Next Steps After Story 1.6

1. **Story 1.7+**: Continue Epic 1 completion (error handling, monitoring, edge cases)
2. **Epic 2**: Document generation system
3. **Epic 3**: Property listing automation
4. **Epic 4-6**: Calculators, email, Telegram

## Key Files to Review

- `docs/prd.md` - Full product requirements
- `docs/architecture/tech-stack.md` - Technical architecture
- `docs/stories/1.6.story.md` - Current story details
- `.bmad-core/core-config.yaml` - BMAD configuration
- `packages/services/src/whatsapp.service.ts` - WhatsApp integration
- `packages/services/src/openai.service.ts` - AI integration
- `apps/web/src/app/api/whatsapp-webhook/route.ts` - Main webhook handler

## Success Metrics

**MVP Success Criteria:**
- 50+ concurrent conversations
- <2 min response times
- 99% uptime
- 40% beta agent adoption (complete all 3 workflows)
- 70%+ satisfaction score
- 3+ hours saved per agent per week
- 85%+ listing upload success rate

---

**Last Updated**: 2025-10-01 16:30 UTC
**Current Story**: 1.6 (COMPLETE - Deployed to Production)
**Epic 1 Status**: ✅ Complete (6/6 stories done)
**Production URL**: https://sophia-agent.vercel.app
**BMAD Version**: v4
