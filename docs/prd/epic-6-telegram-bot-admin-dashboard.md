# Epic 6: Telegram Bot & Admin Dashboard

**Epic Goal:** Provide alternative communication channel through Telegram bot with primary focus on message forwarding, and build web-based admin dashboard for system monitoring, analytics, and configuration. This epic extends Sophia's reach to Telegram users and provides operational visibility for administrators and product owners to track usage, monitor system health, and manage configurations.

## Story 6.1: Telegram Bot Setup & Webhook Integration

As a **developer**,
I want **Telegram Bot API configured with webhook endpoint**,
so that **users can interact with Sophia via Telegram in addition to WhatsApp**.

### Acceptance Criteria

1. Telegram bot created via BotFather with unique bot token
2. Bot token stored securely in Vercel environment variables
3. Webhook endpoint `/api/telegram-webhook` created to receive Telegram messages
4. Webhook registered with Telegram Bot API pointing to Vercel deployment URL
5. Incoming message parsing extracts: user ID, username, message text, chat ID, timestamp
6. Webhook acknowledges receipt with 200 OK
7. All incoming Telegram messages logged to `conversation_logs` table with source='telegram'
8. Basic test message flow: user sends "hello" to bot → bot responds with greeting

## Story 6.2: Telegram User Authentication & Registration

As a **developer**,
I want **Telegram users authenticated and associated with agent accounts**,
so that **only authorized agents can use Sophia on Telegram**.

### Acceptance Criteria

1. `telegram_users` table created with schema: `id` (UUID), `agent_id` (UUID FK), `telegram_user_id` (bigint, unique), `telegram_username` (text), `chat_id` (bigint), `is_active` (boolean), `registered_at` (timestamp)
2. New Telegram users prompted to register: "Welcome! Please provide your zyprus.com email to link your account."
3. Email validation against `agents` table
4. Once validated, Telegram user linked to agent account
5. Subsequent messages automatically authenticated via Telegram user ID
6. Unregistered users receive: "You must register before using Sophia. Please provide your zyprus.com email."
7. Registration flow completes within 3 messages
8. Admin can manually link Telegram users to agents via future admin dashboard

## Story 6.3: Telegram Message Forwarding Functionality

As an **agent**,
I want **to forward messages to contacts via Telegram**,
so that **I can quickly share information through Telegram channel**.

### Acceptance Criteria

1. AI recognizes forward requests on Telegram: "forward this message to @username", "send this to telegram user john"
2. Agent provides recipient Telegram username or chat ID
3. Sophia forwards message content to specified recipient
4. Forward includes optional context: "Forwarded by [agent name] via Sophia"
5. Confirmation sent to agent: "✉️ Message forwarded to @username"
6. Failed forwards reported with error: "❌ Unable to forward. User may have blocked the bot or username is invalid."
7. All forwards logged to database for audit trail
8. Rate limiting implemented to prevent abuse (max 50 forwards/agent/day)

## Story 6.4: Basic Telegram Conversational Features

As an **agent**,
I want **basic conversational features on Telegram similar to WhatsApp**,
so that **I can use Sophia's core features from Telegram**.

### Acceptance Criteria

1. Telegram users can access document generation: "sophia generate marketing form v2"
2. Telegram users can access calculators: "calculate mortgage for 300k"
3. Telegram users can create listings: "create new listing" (if desired, or mark as WhatsApp-only)
4. Telegram users can send emails: "send email to client@example.com"
5. AI responses formatted for Telegram (supports Telegram markdown formatting)
6. Conversation state managed in Redis similar to WhatsApp (shared state engine)
7. All features tested end-to-end on Telegram
8. Performance parity with WhatsApp (response time <5 seconds)

## Story 6.5: Admin Dashboard - Authentication & Layout

As a **admin/product owner**,
I want **secure admin dashboard with authentication**,
so that **only authorized users can access system monitoring and configuration**.

### Acceptance Criteria

1. Admin dashboard created as Next.js pages under `/admin` route
2. Authentication implemented using Supabase Auth (admin-level role required)
3. Login page with email/password authentication
4. Admin users table: `admin_users` with schema: `id` (UUID), `email` (text, unique), `role` (text), `created_at` (timestamp)
5. At least 1 admin user seeded for initial access
6. Protected routes: redirect to login if not authenticated
7. Dashboard layout with navigation: Overview, Agents, Analytics, Templates, Calculators, Logs, Settings
8. Responsive design (works on desktop, tablet)

## Story 6.6: Admin Dashboard - System Overview & Monitoring

As an **admin/product owner**,
I want **system overview dashboard with key metrics and health status**,
so that **I can monitor Sophia's performance and usage at a glance**.

### Acceptance Criteria

1. Overview page displays key metrics:
   - Total registered agents
   - Active conversations (last 24 hours)
   - Total messages processed (today, this week, this month)
   - Document generations (today, this week)
   - Listings created (today, this week)
   - Emails sent (today, this week)
2. System health indicators:
   - Database connection status (green/red)
   - Redis connection status
   - WhatsApp webhook status (last message received timestamp)
   - Telegram webhook status
   - OpenAI API status (last successful call timestamp)
3. Recent activity feed: last 20 interactions (agent, action, timestamp, status)
4. Charts/graphs for usage trends over time (last 7 days, last 30 days)
5. Real-time or near-real-time updates (refresh every 30 seconds or manual refresh button)
6. All metrics queryable via API endpoints created in previous epics

## Story 6.7: Admin Dashboard - Agent Management

As an **admin/product owner**,
I want **agent management interface to view and manage registered agents**,
so that **I can onboard new agents and troubleshoot agent issues**.

### Acceptance Criteria

1. Agent list page displays all agents with: name, phone number, email, registration date, last active, status
2. Search/filter agents by name, phone, email, status
3. Agent detail view shows: full profile, usage statistics, recent activity, linked Telegram account
4. Add new agent form: name, phone number, email (creates record in `agents` table)
5. Edit agent: update name, email, activate/deactivate
6. Deactivate agent: sets `is_active=false`, prevents WhatsApp/Telegram access
7. View agent's conversation history (paginated, searchable)
8. Agent usage analytics: documents generated, listings created, emails sent, calculations performed

## Story 6.8: Admin Dashboard - Analytics & Reporting

As an **admin/product owner**,
I want **analytics dashboard with detailed usage reports**,
so that **I can understand feature adoption and identify improvement opportunities**.

### Acceptance Criteria

1. Analytics page with date range selector (last 7 days, 30 days, custom range)
2. Feature usage breakdown:
   - Most used document templates (top 10)
   - Most used calculators (top 5)
   - Listing upload success rate
   - Email send success rate
3. Agent engagement metrics:
   - Daily active agents (DAU)
   - Weekly active agents (WAU)
   - Most active agents (top 10 by message count)
   - Average messages per agent per day
4. Performance metrics:
   - Average response time (by feature)
   - Error rate (% of failed requests)
   - Conversation completion rate (% of conversations resulting in action)
5. Export analytics data to CSV
6. Charts/visualizations for all metrics (bar charts, line graphs, pie charts)
7. All analytics data pulled from database logs and aggregated efficiently (<2 second load time)

## Story 6.9: Admin Dashboard - Configuration & Template Management

As an **admin/product owner**,
I want **configuration interface to manage templates, calculators, and system settings**,
so that **I can update content without database access or code changes**.

### Acceptance Criteria

1. Templates page lists all document templates with: name, category, usage count, last modified
2. Create new document template form: name, category, template content (textarea), variables (JSON editor)
3. Edit existing template: update content, variables, activate/deactivate
4. Preview template with sample data
5. Delete template (soft delete, sets `is_active=false`)
6. Calculator configuration page lists all calculators with URLs and input fields
7. Edit calculator: update URL, description, input field definitions
8. Email templates management (similar to document templates)
9. System settings page: OpenAI model selection (GPT-4o vs GPT-4o-mini), conversation timeout (Redis TTL), rate limits, feature toggles
10. All changes saved to database with audit log (who changed what and when)
