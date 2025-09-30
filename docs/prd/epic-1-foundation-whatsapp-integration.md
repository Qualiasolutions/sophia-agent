# Epic 1: Foundation & WhatsApp Integration

**Epic Goal:** Establish complete technical foundation from Next.js application through Vercel deployment, Supabase database, WhatsApp Business API integration, and OpenAI conversational AI to deliver a working end-to-end system that receives WhatsApp messages from agents and responds with AI-generated replies. This epic validates the entire architecture and provides the infrastructure upon which all subsequent features will be built.

## Story 1.1: Project Initialization & Deployment Pipeline

As a **developer**,
I want **a Next.js 14+ project with TypeScript initialized, connected to GitHub, and automatically deploying to Vercel**,
so that **we have a working CI/CD pipeline and can iterate rapidly with automatic deployments**.

### Acceptance Criteria

1. Next.js 14+ project created with TypeScript and App Router enabled
2. GitHub repository initialized with main branch protection (require PR reviews)
3. Vercel project connected to GitHub repository with automatic deployments on merge to main
4. Environment variables configured in Vercel dashboard (placeholders for API keys to be added later)
5. Health check endpoint `/api/health` returns 200 OK with system status
6. Vercel deployment successful and accessible via HTTPS URL
7. README.md includes setup instructions, environment variable documentation, and deployment process

## Story 1.2: Supabase Database Setup & Agent Schema

As a **developer**,
I want **Supabase PostgreSQL database configured with agent profiles table and connection from Next.js app**,
so that **we can store agent data and authenticate users against the database**.

### Acceptance Criteria

1. Supabase project connected to Next.js app using environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)
2. `agents` table created with schema: `id` (UUID), `phone_number` (text, unique), `name` (text), `email` (text), `is_active` (boolean), `created_at` (timestamp), `updated_at` (timestamp)
3. Row Level Security (RLS) policies enabled on `agents` table
4. Supabase client library installed and configured in Next.js app
5. Database connection tested via API route `/api/db-test` that queries agents table
6. Migration scripts committed to repository for reproducible schema setup
7. At least 2 test agent records inserted for development/testing

## Story 1.3: WhatsApp Business API Integration

As a **developer**,
I want **WhatsApp Business API webhook endpoint that receives and acknowledges messages**,
so that **agents can send messages to Sophia and the system receives them reliably**.

### Acceptance Criteria

1. Meta WhatsApp Business API account created and verified (business verification may take 2-4 weeks)
2. Webhook endpoint `/api/whatsapp-webhook` created supporting GET (verification) and POST (message receipt)
3. Webhook verification logic implemented (responds to Meta's verification challenge)
4. Webhook registered with Meta WhatsApp Business API pointing to Vercel deployment URL
5. Incoming message parsing extracts: sender phone number, message text, message ID, timestamp
6. Webhook acknowledges receipt with 200 OK within 5 seconds to prevent Meta retries
7. All incoming messages logged to Supabase `conversation_logs` table (schema: `id`, `agent_id`, `message_text`, `direction` (inbound/outbound), `timestamp`, `message_id`)
8. Error handling for invalid payloads, missing fields, or database failures with appropriate logging

## Story 1.4: OpenAI Conversational AI Integration

As a **developer**,
I want **OpenAI API integrated to generate contextual responses to agent messages**,
so that **Sophia can understand and respond to agent requests conversationally**.

### Acceptance Criteria

1. OpenAI Node.js SDK installed and configured with API key from environment variables
2. Conversation orchestration function created that accepts message text and returns AI-generated response
3. GPT-4o-mini model used for initial implementation (cost optimization)
4. System prompt defined that establishes Sophia's identity, role, and conversational style
5. Basic intent recognition for greeting messages (e.g., "hello", "hi sophia") returns friendly introduction
6. Error handling for OpenAI API failures (timeouts, rate limits, invalid requests) with graceful fallback responses
7. Token usage logged for cost monitoring and optimization
8. Response generation completes within 3 seconds for simple queries

## Story 1.5: WhatsApp Message Sending

As a **developer**,
I want **ability to send WhatsApp messages back to agents using Meta API**,
so that **Sophia can deliver AI-generated responses to agents via WhatsApp**.

### Acceptance Criteria

1. WhatsApp send message function implemented using Meta Cloud API
2. Function accepts: recipient phone number, message text
3. Outbound messages logged to `conversation_logs` table with direction='outbound'
4. Message delivery status tracked (sent, delivered, read) via webhook status updates
5. Error handling for send failures (invalid phone number, API errors) with retry logic (max 3 attempts)
6. Rate limiting implemented to respect Meta API limits (80 messages/second limit documented but unlikely to be hit at 100 agent scale)
7. Successfully sends test message to at least 2 test agent phone numbers

## Story 1.6: End-to-End Conversation Flow

As an **agent**,
I want **to send a message to Sophia on WhatsApp and receive an AI-generated response**,
so that **I can validate the system works end-to-end and begin using Sophia for assistance**.

### Acceptance Criteria

1. Agent sends "Hello Sophia" via WhatsApp to Sophia's phone number
2. Message received by `/api/whatsapp-webhook` and logged to database
3. Agent phone number validated against `agents` table (must be registered agent)
4. OpenAI generates contextual greeting response introducing Sophia and available capabilities
5. Response sent back to agent via WhatsApp within 5 seconds of message receipt
6. Complete conversation (inbound + outbound) logged to `conversation_logs` table
7. Unregistered phone numbers receive polite message explaining Sophia is only for zyprus.com agents
8. System handles at least 5 concurrent conversations without errors or delays

## Story 1.7: Conversation State Management with Redis

As a **developer**,
I want **Upstash Redis integration to cache conversation context and state**,
so that **Sophia maintains context across multi-turn conversations without expensive database queries**.

### Acceptance Criteria

1. Upstash Redis account created and connection configured via environment variables
2. Conversation state schema defined: `agent_phone_number`, `conversation_history` (array of messages), `current_intent`, `last_activity_timestamp`
3. State stored in Redis with TTL of 30 minutes (conversation expires after inactivity)
4. Conversation context retrieved from Redis on incoming message for context-aware responses
5. Conversation context updated in Redis after each message exchange
6. Fallback to database query if Redis unavailable or key expired
7. Redis connection pooling implemented for efficient resource usage
8. State retrieval completes in <50ms for cached conversations

## Story 1.8: Error Handling & Monitoring

As a **developer**,
I want **comprehensive error handling and logging across all services**,
so that **we can diagnose issues quickly and ensure system reliability**.

### Acceptance Criteria

1. Global error handler in Next.js API routes catches unhandled exceptions
2. All errors logged with structured format: timestamp, error type, message, stack trace, context (agent ID, message ID)
3. Vercel logs accessible and searchable via Vercel dashboard
4. Supabase logs reviewed for database errors and slow queries
5. WhatsApp webhook failures logged with retry attempts tracked
6. OpenAI API errors logged with token usage and model details
7. Health check endpoint `/api/health` validates: database connection, Redis connection, external API availability
8. Alert mechanism defined (Vercel notifications or email) for critical failures (webhook down, database unreachable)
