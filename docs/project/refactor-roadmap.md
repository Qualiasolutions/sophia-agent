# SophiaAI Refactor Roadmap (Jan 2025)

## 1. Current State Snapshot
- **Core stack**: Next.js 15 admin (`apps/web`), backend API routes, shared services in `packages/services`, Supabase migrations in `packages/database/supabase`.
- **Channel coverage**: WhatsApp webhook upgraded to Meta (`apps/web/src/app/api/whatsapp-webhook/route.ts`) but several utilities and tests still assume Twilio (`apps/web/src/app/api/test-message/route.ts`, `apps/web/src/app/api/debug-env/route.ts`, `packages/services/src/message-forward.service.ts`).
- **Telegram**: Production webhook implemented (`apps/web/src/app/api/telegram-webhook/route.ts`) with DeepSeek fallback, but registration logic looks up `agents.status` which the schema does not expose (`packages/services/src/telegram-auth.service.ts:52` vs `packages/database/supabase/migrations/001_create_agents_table.sql`).
- **Gmail & zyprus.com**: Only requirements docs exist; no service clients or API routes ship today.
- **Admin dashboard**: Feature-complete UI, yet NextAuth credentials rely on a hard-coded access code (`apps/web/src/app/api/auth/[...nextauth]/route.ts:17`) and admin APIs mix Supabase env vars (`SUPABASE_URL` vs `NEXT_PUBLIC_SUPABASE_URL`).

## 2. Critical Gaps by Surface
- **WhatsApp**
  - Meta webhook/processors ship, but delivery status handler still maps Twilio enums (`apps/web/src/app/api/whatsapp-webhook/route.ts:188`).
  - Message forwarding service instantiates the Twilio client (`packages/services/src/message-forward.service.ts:18`).
  - Legacy Twilio service exported publicly (`packages/services/src/index.ts:2-7`) and consumed by `test-message` route.
- **Telegram**
  - Registration bug: supabase query filters on `status` column (`packages/services/src/telegram-auth.service.ts:52`).
  - Rate limiting/session caches live in-memory; no Upstash adapter despite architectural requirement.
  - `getDeepSeekService` assumed to exist, but `packages/services/src/index.ts` does not export it.
- **Gmail**
  - No implementation of OAuth, token storage, or mail send pipeline.
  - Supabase schema missing `emails` table referenced in docs.
- **zyprus.com**
  - No API client or env placeholders.
  - Listing workflows in docs rely on non-existent `property_listings` table and service layer.
- **Shared services**
  - Duplicate EnhancedDocumentService definitions (`packages/services/src/enhanced-document.service.ts`, `packages/services/src/document-enhanced.service.ts`) with diverging APIs; only the first is exported.
  - `document.service.ts` imports `knowledge-base.service` which is absent in the tree; code would throw at runtime.
  - `template-migration.service.ts` references `supabase` without defining a client.
  - `ChatbaseService` ignores provided `conversationId` and never adds the required API key header (`packages/services/src/chatbase.service.ts:59-88`).
- **Database**
  - Migration numbering collisions (`010_…`, `021_…`) and missing referential updates for new features.
  - Seed agents use non-zyprus emails (`packages/database/supabase/seed.sql`).
- **Repo hygiene**
  - Empty `apps/web/packages/*` directories.
  - `dev/` contains scripts that should be tagged or archived.

## 3. Cleanup & Consolidation Targets
- **Remove/merge unused services**: Fold `document-enhanced`, `document-optimized`, `openai-enhanced`, and `assistant.service` into a single enhanced document pipeline; drop dead code referencing missing modules.
- **Unify channel clients**: Decide on Meta-only WhatsApp service and delete or quarantine Twilio-specific files/tests; ensure message forwarding uses Meta transport.
- **Fix Supabase access**: Standardise on `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` across admin APIs; add helper wrappers for REST usage to avoid repetition.
- **Security hardening**: Replace hard-coded admin access code with environment-driven hashed secret or Supabase-backed auth; audit `/api/debug-env` exposure before production.
- **Database consistency**: Renumber migrations sequentially, add missing tables (`emails`, `property_listings`, `system_config` defaults), and cross-check services for column names.
- **Integration scaffolding**: Introduce service stubs for Gmail (OAuth + send/forward) and zyprus.com (REST client + data mappers) with feature-flagged entry points in webhooks/admin UI.

## 4. Proposed Phases
### Phase 0 – Stabilise & Document (Week 1)
- Freeze deployments; capture current environment variables and Supabase schema snapshot.
- Publish this roadmap in `docs/project` (complete) and circulate to stakeholders.
- Add automated lint/test enforcement during CI (turbo `test`/`lint` targets).

### Phase 1 – Repository Hygiene (Week 1-2)
- Delete empty `apps/web/packages/*`; move dev scripts into `dev/scripts/legacy` with README.
- Remove/arch Archive unused services; write ADR describing new service layout.
- Fix NextAuth access control (`NEXT_AUTH_ADMIN_CODE` env, hashed comparison) and gate `/api/debug-env`.

### Phase 2 – Backend Alignment (Week 2-3)
- Refactor WhatsApp services: keep Meta client, wrap Twilio legacy in `legacy/` if still required, update message forwarding/test routes, adjust webhook status handling.
- Repair Telegram auth (`is_active` filter), export DeepSeek service properly, and persist registration state using Supabase/Redis.
- Reconcile document generation stack: keep one EnhancedDocumentService, delete broken modules, add integration tests covering `document_request_sessions`.
- Normalize Supabase helper usage; convert direct `createClient` calls in admin APIs to `createAdminClient`.

### Phase 3 – Data & Integrations (Week 3-4)
- Renumber and re-run migrations in a Supabase branch; add missing tables and outcomes.
- Implement Gmail service (OAuth token storage, send API) with guarded routes and feature flags.
- Scaffold zyprus.com client with configuration, metrics, and admin controls; start with mock adapters while awaiting real API.

### Phase 4 – Frontend & Telemetry (Week 4+)
- Update admin dashboard to expose new email/listing statuses.
- Add health dashboards for integrations (Meta/Gmail/zyprus) and refactor analytics calls to aggregate via services.
- Expand Vitest suites to cover new flows; add Playwright smoke tests for admin-critical paths.

## 5. Redeploy Checklist
- Run `npm run lint`, `npm run test`, `npm run build` at repo root and address failures.
- Execute Supabase CLI migrations against staging, validate RLS policies, and reseed.
- Configure environment variables per surface (Meta, Telegram, Gmail, zyprus, Supabase, OpenAI).
- Smoke test WhatsApp/Telegram webhooks using provided scripts, then promote build to Vercel.
- Monitor `/api/health?detailed=true` and Supabase logs for 24 hours post-deploy.
