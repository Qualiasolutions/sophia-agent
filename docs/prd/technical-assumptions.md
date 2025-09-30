# Technical Assumptions

## Repository Structure

**Monorepo** - Single Next.js repository containing all API routes (serverless functions), admin dashboard frontend, and shared libraries for common utilities, authentication, and logging.

**Rationale:** With serverless architecture on Vercel and a small-to-medium scale (100 agents), a Next.js monorepo provides the simplest development experience. All API routes live alongside the admin dashboard, shared TypeScript types are easily accessible, and deployment is a single command. This approach eliminates the complexity of managing multiple repositories and container orchestration while maintaining clear separation of concerns through folder structure.

## Service Architecture

**Serverless Functions (Vercel) + Backend-as-a-Service (Supabase)** - API routes as serverless functions with Supabase providing database, auth, and storage.

**Core API Routes (Vercel Serverless Functions):**
- **/api/whatsapp-webhook** - Handles Meta WhatsApp Business API webhooks, message processing
- **/api/telegram-webhook** - Manages Telegram Bot API webhooks and message routing
- **/api/conversation** - Orchestrates conversation flows, AI intent recognition, workflow routing
- **/api/documents** - Document generation using templates with variable substitution
- **/api/listings** - Property listing workflow and zyprus.com API integration
- **/api/email** - Gmail API integration for sophia@zyprus.com email management
- **/api/calculator** - Real estate calculation endpoints (mortgage, ROI, commission)
- **/api/admin/\*** - Admin dashboard backend APIs (agent management, analytics, logs)

**Supabase Services:**
- **PostgreSQL Database** - Agent profiles, conversation logs, document templates, listing data
- **Supabase Auth** - Agent authentication and authorization
- **Supabase Storage** - Document template storage (if files needed)
- **Row Level Security (RLS)** - Database-level security policies

**State Management:**
- **Upstash Redis (Serverless)** - Conversation state caching, session management (500K commands/month free tier)
- **Alternative:** Vercel KV if Redis integration proves unnecessary

**Rationale:** Serverless architecture eliminates infrastructure management, scales automatically with demand, and aligns with cost optimization goals. Supabase provides production-ready database, auth, and storage without managing servers. This stack enables rapid development with near-zero operational overhead and costs significantly less than traditional cloud infrastructure (~$45/month vs $150+/month for AWS equivalent).

## Testing Requirements

**Unit + Integration Testing** - Comprehensive test coverage for business logic and external integrations.

**Testing Strategy:**
- **Unit Tests:** Core business logic (template rendering, calculation algorithms, conversation state management) using Jest
- **Integration Tests:** API route testing with mocked external services (WhatsApp, Telegram, Gmail), Supabase database operations
- **API Contract Tests:** Validate external API integrations (WhatsApp, Telegram, zyprus.com) with test accounts
- **End-to-End Tests:** Critical workflows (document generation, listing upload) using Playwright or Cypress to simulate complete user journeys
- **Manual Testing:** Conversational AI quality, error handling edge cases, real WhatsApp/Telegram interaction testing

**CI/CD Integration:** GitHub Actions automated testing on every pull request, blocking merges on test failures, automatic deployment to Vercel on merge to main.

**Rationale:** Testing is essential for conversational AI reliability. Unit tests ensure logic correctness, integration tests validate external dependencies, and E2E tests provide confidence in real-world scenarios. Manual testing remains critical for conversation quality assessment that automated tests cannot fully capture.

## Additional Technical Assumptions and Requests

**Backend Framework & Language:**
- **Next.js 14+ (App Router) with TypeScript** for entire application (frontend + API routes)
- **Rationale:** Next.js API routes provide serverless functions out-of-the-box, perfect Vercel integration, excellent TypeScript support, unified codebase for frontend and backend reduces context switching

**Frontend (Admin Dashboard):**
- **Next.js 14+ with React and TypeScript**
- **UI Framework:** Tailwind CSS for styling, shadcn/ui for component library (optional)
- **Rationale:** Same framework as backend simplifies development, server-side rendering improves admin dashboard performance, Tailwind provides rapid UI development

**AI/NLP Framework:**
- **Primary:** OpenAI GPT-4o or GPT-4o-mini for conversational understanding, intent classification, and document generation
- **OpenAI SDK:** Official Node.js SDK for API integration
- **Rationale:** Already have OpenAI API key, proven conversational capabilities, excellent API support, cost-effective (GPT-4o-mini for simple intents ~$0.15/1M tokens, GPT-4o for complex workflows ~$2.50/1M tokens)

**Database & Backend Services:**
- **Supabase PostgreSQL** for all relational data (agent profiles, conversation logs, listing data, templates)
- **Supabase Auth** for agent authentication with row-level security policies
- **Supabase Storage** for document template files (if needed beyond database storage)
- **Rationale:** Already have Supabase project provisioned, provides 500MB database + 10GB bandwidth on free tier (sufficient for MVP), built-in auth eliminates custom authentication code, PostgreSQL JSON support provides schema flexibility

**State Management & Caching:**
- **Upstash Redis (Serverless)** for conversation state caching and session management
- **Free Tier:** 500K commands/month, 256MB storage (sufficient for 20+ concurrent conversations)
- **Rationale:** Serverless Redis eliminates infrastructure management, generous free tier, sub-millisecond latency for conversation state retrieval

**Hosting & Infrastructure:**
- **Vercel Pro ($20/month)** - Already provisioned
  - 150K serverless function invocations/month (sufficient for ~300 messages/hour × 12 hours × 30 days = 108K/month)
  - 100GB bandwidth/month
  - Automatic HTTPS/SSL certificates
  - Edge network for global performance
  - GitHub integration for automatic deployments
- **Rationale:** Already have Vercel Pro account, zero infrastructure management, automatic scaling, built-in CI/CD, significantly cheaper than AWS/GCP/Azure traditional hosting

**External Integrations:**
- **WhatsApp Business API (Meta)** - Webhook-based integration, requires business verification and API approval (2-4 week process)
- **Telegram Bot API** - Webhook-based integration, token authentication
- **Gmail API** - OAuth 2.0 for sophia@zyprus.com workspace account, token storage in Supabase
- **zyprus.com API** - Authentication mechanism TBD (requires discovery with zyprus.com technical team)
- **OpenAI API** - Already have API key, token-based authentication

**Security & Compliance:**
- **Secrets Management:** Vercel Environment Variables for API keys (OpenAI, WhatsApp, Telegram, Gmail OAuth credentials)
- **Database Encryption:** Supabase provides encryption at rest (PostgreSQL) and in transit (TLS)
- **GDPR Compliance:** Data retention policies implemented in Supabase, user data deletion endpoints, audit logging via Supabase logs
- **Rate Limiting:** Per-agent rate limiting using Upstash Redis or Vercel Edge Middleware
- **Row Level Security:** Supabase RLS policies to ensure agents can only access their own data
- **Dependency Scanning:** Dependabot or Snyk for vulnerability scanning

**Development & Deployment:**
- **Version Control:** GitHub repository
- **CI/CD Pipeline:** GitHub Actions for automated testing + Vercel automatic deployment on merge to main
- **Monitoring & Observability:**
  - Vercel Analytics for performance monitoring
  - Vercel Logs for serverless function logs
  - Supabase Dashboard for database queries and logs
  - Sentry (optional) for error tracking and alerting
- **Rationale:** Vercel's native GitHub integration provides zero-config CI/CD, automatic preview deployments for pull requests, instant rollbacks

**API Documentation:**
- **Internal API Documentation:** TypeScript types serve as API contracts
- **External API Documentation:** Swagger/OpenAPI spec for admin dashboard API (if third-party integrations needed)

**Scalability Considerations:**
- **Serverless Auto-Scaling:** Vercel automatically scales functions based on demand
- **Database Connection Pooling:** Supabase provides connection pooling (Supavisor) to handle concurrent connections efficiently
- **Conversation State TTL:** Redis keys expire after conversation timeout (configurable, e.g., 30 minutes inactivity)
- **Cold Start Mitigation:**
  - Use Vercel Edge Functions for critical paths (faster cold starts)
  - Implement periodic health check pings to keep functions warm during business hours
  - Optimize bundle size to reduce cold start time

**Cost Optimization:**
- **LLM Costs:** Use GPT-4o-mini for simple intents (document requests, calculations), GPT-4o only for complex conversations (listing creation)
- **Conversation Context Management:** Limit context window size, summarize long conversations to reduce token usage
- **Caching:** Cache frequent AI responses (e.g., common calculator results, document template suggestions) in Redis
- **Database Optimization:** Use Supabase indexes for frequent queries, implement pagination for logs/analytics
