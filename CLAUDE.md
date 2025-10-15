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
- **AI**: OpenAI GPT-4o-mini (Chat Completions API only - no Assistants API)

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
│   └── deployment/           # Deployment documentation
├── 📁 Knowledge Base/        # Knowledge Base and Source of Truth
│   └── Sophias Source of Truth/
│       ├── Registeration Forms/
│       │   ├── reg_final/   # Optimized registration instructions (11 files)
│       │   ├── Reg_ to Owners.docx
│       │   ├── Reg_Banks.docx
│       │   ├── Reg_Developers_.docx
│       │   └── Registrations multiple sellers .docx
│       └── MArketing & Viewing Forms/
│           └── final/       # Viewing forms & marketing agreements (4 files)
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
  - `openai.service.ts`: **PRIMARY AI SERVICE** - Handles ALL AI interactions including document generation (no Assistant delegation)
  - `whatsapp.service.ts`: Meta Cloud API integration (NOT Baileys/Twilio)
  - `telegram.service.ts`: Telegram Bot API integration
  - `document.service.ts`: PDF generation and document handling
  - `calculator.service.ts`: Real estate calculations (mortgage, ROI, rental yield)
  - `rate-limiter.service.ts`: Upstash Redis-based rate limiting
  - `metrics.service.ts`: Performance monitoring
  - `document-optimized.service.ts`: Optimized document generation with caching (legacy, may be deprecated)
  - `template-cache.service.ts`: Template caching for performance
  - `template-intent.service.ts`: Template intent recognition
  - `template-optimizer.service.ts`: Template optimization
  - `performance-analytics.service.ts`: Performance tracking and analytics
  - `assistant.service.ts`: ⚠️ **DEPRECATED** - No longer used (removed 2025-10-12)

### Shared Infrastructure
- `packages/shared/`: Shared types, errors, constants, utils (imported as `@sophiaai/shared`)
- `packages/database/`: Supabase migrations (numbered: `001_create_agents_table.sql`, etc.)

**Multi-Channel Request Flow**:
1. **WhatsApp**: Meta Cloud API webhook → `api/whatsapp-webhook/route.ts` → OpenAI Service → response
   - Handles delivery status updates from Meta Cloud API
   - **Uses OpenAI Service for ALL responses** (chat, document generation, calculations)
   - Async processing with conversation history stored in `conversation_logs`
2. **Telegram**: Bot API webhook → `api/telegram-webhook/route.ts` → OpenAI Service → response via TelegramService
   - User registration flow with email verification
   - Message forwarding to WhatsApp capability
   - Rate limiting and metrics tracking
3. **Email**: Gmail API integration for document sending and client communication
4. **AI Processing**: **OpenAI Service ONLY** - Single system prompt handles all interactions (no delegation)

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
- `template_cache`: Template caching service for optimized document generation (created 2025-10-09)

**MCP Access**: Full Supabase MCP integration available for database operations.

**Migration Pattern**: Sequential numbering (`001_`, `002_`, etc.) in `packages/database/supabase/migrations/`

## External Integrations

- **WhatsApp**: Meta Cloud API (official Business API) - NOT Twilio or Baileys
- **Telegram**: Bot API with webhook support and user registration
- **Email**: Gmail API with OAuth authentication
- **AI**: OpenAI GPT-4o-mini (Chat Completions API only - maxTokens: 800)
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
The system uses optimized instruction files located in `Knowledge Base/Sophias Source of Truth/Registeration Forms/reg_final/`

### Registration Flow (Updated 2025-10-12)
Sophia follows a streamlined 2-step flow using a single system prompt in OpenAI Service:

**Step 1 - Category Selection:**
- User: "seller" or "registration" or "1"
- Sophia: "What type of registration do you need? 1. Seller(s) 2. Banks 3. Developers"
- **Accepts both numbers (1/2/3) AND text (seller/bank/developer)**

**Step 2 - Type Selection + Field Collection:**
- User: "standard" or "1"
- Sophia: Shows numbered field list with EXACT format:
```
Please share the following so I can complete the standard seller registration template:

1) *Client Information:* buyer name (e.g., Fawzi Goussous)

2) *Property Introduced:* registration number or detailed description (e.g., Reg. No. 0/1789 Tala, Paphos)

3) *Property Link:* Zyprus URL if available (optional but encouraged)

4) *Viewing Arranged For:* date and time (e.g., Saturday 12 October at 15:00)

Once I have this information, I'll generate the registration document for you!
```

**Step 3 - Immediate Generation:**
- User provides all fields
- Sophia generates document **IMMEDIATELY** (no confirmation step)

### Available Registration Types (11 total)
- **Standard Seller Registration** (01) - Regular property registrations
- **Seller with Marketing Agreement** (02) - Riskier cases with marketing terms
- **Rental Property Registration** (03) - Landlord/tenant registrations (tenancy)
- **Advanced Seller Registration** (04) - Multiple properties/special terms
- **Bank Property Registration** (05) - Bank-owned properties (REMU, Gordian, etc.)
- **Bank Land Registration** (06) - Bank-owned land (requires viewing form)
- **Developer Registration - Viewing** (07) - With scheduled viewing
- **Developer Registration - No Viewing** (08) - Without viewing scheduled
- **Multiple Sellers Clause** (09) - Add-on for co-owners

### Registration Greeting Formats (Updated 2025-10-13)

**Standard Seller & Marketing:**
- Greeting: `Dear [SELLER_NAME], (Seller)`
- Always ask for seller name

**Rental Property (Silent Logic):**
- **Default**: `Dear XXXXXXXX,` (NEVER ask for landlord name)
- **If provided**: `Dear [LANDLORD_NAME], (landlord)` (only if user mentions it)
- **CRITICAL**: Sophia NEVER explains this logic to user
- **Keywords**: "rental", "tenancy", "letting" all trigger rental registration

**Bank Property:**
- Greeting: `Dear [BANK_NAME] Team,` (e.g., "Dear Remu Team,")
- Auto-detected from property URL (remuproperties.com → Remu, gordian → Gordian, altia → Altia, altamira → Altamira)
- Mobile label: `(please call me to arrange a viewing)`
- Client phone masked with space before ** (e.g., `+44 79 ** 83 24 71`)

**Bank Land:**
- Greeting: `Dear [BANK_NAME] Team,` (e.g., "Dear Remu Team,")
- Auto-detected from property URL (same as Bank Property)
- Mobile label: `(please call me for any further information)`
- Client phone masked WITHOUT space before ** (e.g., `+44 79** 832471`)
- Includes reminder to attach viewing form

**Developer:**
- Greeting: `Dear XXXXXXXX,` (placeholder, never ask for developer name)

### Quick Reference: Greeting Summary

| Registration Type | Greeting Format | Notes |
|-------------------|-----------------|-------|
| Standard Seller | `Dear [SELLER_NAME], (Seller)` | Always ask for name |
| Marketing Agreement | `Dear [SELLER_NAME], (Seller)` | Always ask for name |
| Rental Property | `Dear XXXXXXXX,` or `Dear [LANDLORD_NAME], (landlord)` | NEVER ask; silent logic |
| Bank Property | `Dear [BANK_NAME] Team,` | Auto-detect from URL |
| Bank Land | `Dear [BANK_NAME] Team,` | Auto-detect from URL |
| Developer | `Dear XXXXXXXX,` | Never ask for name |

### Key Features
- **Text Recognition**: Accepts both numbers (1, 2, 3) AND text ("seller", "standard", "marketing", etc.)
- **No Confirmation Step**: Generates documents immediately when all fields provided
- **Numbered Field List Format**: Uses 1), 2), 3) with bold asterisks for field labels
- **Exact Format Copy-Paste**: Documents match professional templates exactly
- **Subject Line Separation**: Sent in separate message for clarity
- **Phone Number Masking**: Auto-masks middle digits (99 ** 67 32)

### Technical Implementation (2025-10-12)
- **OpenAI Service** (`openai.service.ts`): **PRIMARY SERVICE** - Single system prompt handles ALL document generation
  - maxTokens: 800 (sufficient for complete registration documents)
  - Temperature: 0.7
  - Model: GPT-4o-mini
  - **No Assistant delegation** - everything in system prompt
- **Template Instructions**: Each registration type has detailed instruction file in Knowledge Base
- **Legacy Services** (may be deprecated):
  - `template-intent.service.ts`: Intent classification
  - `template-cache.service.ts`: Template caching
  - `document-optimized.service.ts`: Optimized generation

### Important Notes
- **ALL document requests now handled by OpenAI Service system prompt** (no Assistant API)
- System prompt located in `packages/services/src/openai.service.ts` (lines 10-106)
- Text recognition works because requests no longer bypass system prompt
- Template instructions in `Knowledge Base/Sophias Source of Truth/Registeration Forms/reg_final/`

### Property Description Examples (Cyprus Real Estate)

**Rental Properties:**
- "Reg. No. 0/1789 Tala, Paphos" → "Your Property in Tala, Paphos with Registration No. 0/1789"
- "Townhouse Sirina Complex Unit No. G6 Potamos Germasogeias, Limassol"
- "House at Konia, Paphos"
- "2-bedroom apartment in Larnaca"

**Bank Properties:**
- URLs from: remuproperties.com, gordian, altia, altamira
- Example: `https://www.remuproperties.com/Cyprus/listing-29190`
- Sophia auto-detects bank name from URL

**Standard Seller:**
- "Reg No. 0/2456 Tala, Paphos"
- "Your Property in [LOCATION] with Registration No. [NUMBER]"

## Viewing Forms & Marketing Agreements (Added 2025-10-13)

**Template Location:** `Knowledge Base/Sophias Source of Truth/MArketing & Viewing Forms/final/`

Sophia now supports viewing forms and marketing agreements in addition to registrations, following the same streamlined flow pattern.

### Viewing Forms Flow

**Step 1 - Type Selection:**
- User: "viewing" or "viewing form" or "view property"
- Sophia: "What type of viewing form do you need? 1. *Standard* 2. *Advanced* 3. *Multiple Persons*"
- **Accepts both numbers (1/2/3) AND text (standard/advanced/multiple/couple/family)**

**Step 2 - Field Collection:**
- Sophia asks for required fields using numbered list format
- Fields vary by type (7 fields for standard/advanced, 10+ for multiple persons)

**Step 3 - Immediate Generation:**
- User provides all fields → Sophia generates document immediately
- **NO subject lines** (viewing forms are standalone documents)

### Available Viewing Form Types (3 total)

- **Standard Viewing Form** (01) - Single person, simple viewing
  - 7 fields: Date, Client Name, Client ID, Reg Number, District, Municipality, Locality
  - Company: "CSC Zyprus Property Group LTD (Reg. No. 742, Lic. No. 378/E)"

- **Advanced Viewing/Introduction Form** (02) - With legal protection clause
  - Same 7 fields as standard
  - Title: "Viewing/Introduction Form" (includes digital introductions)
  - Extensive legal protection paragraph for exclusive representation

- **Multiple Persons Viewing Form** (03) - For 2+ people (couples, partners, families)
  - 10+ fields: Date, Person 1 (Name/Passport/Country), Person 2 (Name/Passport/Country), District, Municipality, Reg Number
  - Uses plural "we" instead of "I"
  - Each person gets numbered entry and separate signature space
  - Company reference uses "L.N." instead of "Lic. No."

### Marketing Agreements Flow

**Step 1 - Critical Question:**
- User: "marketing" or "marketing agreement" or "promote property"
- Sophia: "Are you using the standard agreement terms, or do you need custom terms?"

**Step 2 - Field Collection:**
- Sophia asks for 6 required fields:
  1. Date (e.g., 1st March 2026)
  2. Seller Name (e.g., George Papas)
  3. Property Registration (e.g., 0/12345 Tala, Paphos)
  4. Agency Fee (default: 5.0% plus VAT)
  5. Marketing Price (e.g., €350,000)
  6. Agent Name (e.g., Danae Pirou)

**Step 3 - Conditional Generation:**
- **If STANDARD terms** → Include "Charalambos Pitros" signature placeholder
- **If CUSTOM terms** → NO signature, add contact note for Marios Poliviou (marios@zyprus.com, +357 99 92 15 60)

### Available Marketing Agreement Type (1 total)

- **Marketing Agreement** (04) - Non-exclusive 30-day agreement
  - NON-EXCLUSIVE agreement with 5.0% + VAT default fee
  - Includes direct communication protection clause (clause 6)
  - Special signature handling based on standard vs custom terms
  - **NO subject lines** (marketing agreements are standalone documents)

### Key Features

- **Same Flow Pattern**: Follows registration flow (type selection → field collection → immediate generation)
- **Text Recognition**: Accepts both numbers AND text responses
- **No Subject Lines**: Viewing forms and marketing agreements are standalone documents
- **Exact Format**: Documents match professional templates exactly
- **Company Details**: Precise wording varies by document type (Reg. No. vs L.N.)
- **Legal Protection**: Advanced viewing form includes extensive legal clause

### Technical Implementation

- **System Prompt**: Contains all viewing and marketing logic in `openai.service.ts`
- **Document Type Detection**: Keywords trigger appropriate flow (viewing/marketing/registration)
- **Template Instructions**: Each form type has detailed instruction markdown file
- **No PDF Generation**: Documents sent as formatted WhatsApp text messages

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
- `packages/services/src/openai.service.ts` - **PRIMARY AI SERVICE** - ALL responses including document generation (system prompt lines 10-106)
- `packages/services/src/whatsapp.service.ts` - Meta Cloud API integration
- `packages/services/src/telegram.service.ts` - Telegram Bot API integration
- `packages/services/src/document.service.ts` - PDF generation and document handling
- `packages/services/src/assistant.service.ts` - ⚠️ **DEPRECATED** (removed 2025-10-12)

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
  - `check-recent-logs.mjs` - View recent conversation logs
  - `setup-telegram-webhook.ts` - Configure Telegram webhook
  - `test-webhook-local.mjs` - Test webhook locally
  - `load-templates.mjs` - Load document templates into cache
- `project/summaries/` - EPIC summaries and session reports
- `project/deployment/` - Deployment documentation
- `.config/mcp/` - MCP server configurations

### Document Services Architecture (Updated 2025-10-12)
**IMPORTANT CHANGE**: Document generation now uses a **single system prompt** in OpenAI Service:

1. **OpenAI Service** (`openai.service.ts`): **PRIMARY SERVICE**
   - System prompt contains ALL registration logic (lines 10-106)
   - Handles category selection, type selection, field collection, and generation
   - Accepts both numbers AND text responses
   - No Assistant delegation or service routing

2. **Template Instructions** (Knowledge Base):
   - Detailed instructions for each registration type
   - Located in `Knowledge Base/Sophias Source of Truth/Registeration Forms/reg_final/`
   - Used as reference, not dynamically loaded

3. **Legacy Services** (may be deprecated in future):
   - `template-intent.service.ts`: Intent classification (not currently used)
   - `template-cache.service.ts`: Template caching (not currently used)
   - `document-optimized.service.ts`: Optimized generation (not currently used)
   - `assistant.service.ts`: ⚠️ **REMOVED** - no longer in use

**Common Issues & Solutions:**
- If text recognition not working: Check system prompt in `openai.service.ts` (no delegation should occur)
- If wrong format: Check system prompt field collection format (lines 59-80)
- If Assistant errors: Remove any Assistant delegation - system should use OpenAI Service only
- If Sophia explains rental greeting logic: She should NEVER mention landlord name unless user asks - silent operation only
- If "tenancy" not recognized: Ensure keyword mapping includes rental/tenancy/letting as equivalents

### Performance Optimization
- `packages/services/src/document-optimized.service.ts` - Optimized document generation
- `packages/services/src/template-cache.service.ts` - Template caching
- `packages/services/src/performance-analytics.service.ts` - Performance tracking
- Migration `020_create_optimized_document_generations_table.sql` - Performance monitoring table
