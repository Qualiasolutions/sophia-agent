# 2. High Level Architecture

## 2.1 Technical Summary

**Architecture Style**: Serverless, Event-Driven, Monorepo
**Primary Language**: TypeScript
**Deployment Model**: Continuous Deployment via Vercel
**Database**: PostgreSQL (Supabase) with Row-Level Security
**Caching Layer**: Redis (Upstash) for conversation state and rate limiting

## 2.2 Platform Choice

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Frontend Framework** | Next.js 14+ App Router | Server components, automatic code splitting, Vercel integration |
| **Backend** | Next.js API Routes (serverless) | Co-located with frontend, automatic scaling, TypeScript shared |
| **Database** | Supabase (PostgreSQL) | Built-in auth, RLS, storage, real-time subscriptions |
| **Caching** | Upstash Redis | Serverless-friendly, HTTP REST API, global replication |
| **Deployment** | Vercel | Zero-config, edge network, preview deployments, built for Next.js |

## 2.3 Repository Structure

```
sophiaai/                          # Monorepo root
├── apps/
│   └── web/                       # Next.js application
│       ├── src/
│       │   ├── app/               # App Router pages
│       │   ├── components/        # React components
│       │   ├── server/            # tRPC routers
│       │   └── stores/            # Zustand state management
│       └── package.json
├── packages/
│   ├── services/                  # Business logic layer
│   ├── shared/                    # Shared types, schemas, constants
│   ├── database/                  # Migrations, seeds
│   └── config/                    # Shared configurations
├── .github/workflows/             # CI/CD pipelines
├── docs/                          # Documentation
├── package.json                   # Workspace root
└── tsconfig.json                  # Root TypeScript config
```

## 2.4 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL USERS & SYSTEMS                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │WhatsApp  │  │Telegram  │  │Gmail     │  │zyprus.com│       │
│  │Agents    │  │Agents    │  │(OAuth)   │  │API       │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
└───────┼─────────────┼─────────────┼─────────────┼───────────────┘
        │             │             │             │
        │ Webhooks    │ Webhooks    │ API calls   │ REST API
        │             │             │             │
┌───────▼─────────────▼─────────────▼─────────────▼───────────────┐
│                    VERCEL PLATFORM (Next.js)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    API Routes Layer                       │   │
│  │  /api/webhooks/whatsapp                                   │   │
│  │  /api/webhooks/telegram                                   │   │
│  │  /api/trpc/[trpc]  (tRPC router)                         │   │
│  └─────────────────────┬────────────────────────────────────┘   │
│                        │                                          │
│  ┌─────────────────────▼────────────────────────────────────┐   │
│  │              Business Logic Layer (Services)              │   │
│  │  ConversationService │ DocumentService │ CalculatorService│   │
│  │  EmailService │ ListingService │ WhatsAppService          │   │
│  └─────────────────────┬────────────────────────────────────┘   │
│                        │                                          │
│  ┌─────────────────────▼────────────────────────────────────┐   │
│  │                   Admin Dashboard UI                      │   │
│  │  Next.js App Router │ React Server Components │ Zustand  │   │
│  └───────────────────────────────────────────────────────────┘   │
└───────────────────────────┬──────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌──────────────┐
│   SUPABASE    │   │ UPSTASH REDIS │   │   OPENAI     │
│               │   │               │   │              │
│ • PostgreSQL  │   │ • Conversation│   │ • GPT-4o-mini│
│ • Auth (JWT)  │   │   State       │   │ • Intent     │
│ • Storage     │   │ • Rate Limit  │   │   Classifier │
│ • RLS         │   │ • Dist. Locks │   │ • Response   │
└───────────────┘   └───────────────┘   └──────────────┘
```

## 2.5 Architectural Patterns

- **Repository Pattern**: Data access abstraction via Supabase client
- **Service Layer**: Business logic encapsulated in service classes
- **Event-Driven**: Webhook-driven message processing
- **CQRS (light)**: tRPC separates queries and mutations
- **Distributed Locking**: Redis-based locks for conversation state
- **Circuit Breaker**: Fail-fast for external API failures
- **Retry with Backoff**: Exponential backoff for transient errors

---
