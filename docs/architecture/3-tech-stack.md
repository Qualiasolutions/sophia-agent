# 3. Tech Stack

| Category | Technology | Version | Purpose | Notes |
|----------|-----------|---------|---------|-------|
| **Frontend Framework** | Next.js | 14+ | React framework, SSR, routing | App Router with Server Components |
| **Language** | TypeScript | 5.x | Type safety, DX | Strict mode enabled |
| **UI Library** | React | 18+ | Component-based UI | Server + Client components |
| **UI Components** | shadcn/ui | Latest | Pre-built accessible components | Built on Radix UI + Tailwind |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS | With custom design system |
| **State Management** | Zustand | 4.x | Global client state | For dashboard UI state |
| **Forms** | React Hook Form | 7.x | Form validation, performance | With Zod schema validation |
| **Validation** | Zod | 3.x | Runtime type validation | Shared between client/server |
| **API Layer** | tRPC | 10.x | End-to-end type-safe APIs | For admin dashboard |
| **Database** | PostgreSQL | 15+ | Relational database | Via Supabase |
| **Database Client** | Supabase JS | 2.x | PostgreSQL client + RLS | Official Supabase SDK |
| **Caching** | Upstash Redis | 7+ | In-memory cache, locks | HTTP REST API for serverless |
| **Authentication** | Supabase Auth | 2.x | User authentication | JWT-based with RLS |
| **Storage** | Supabase Storage | 2.x | Document/file storage | S3-compatible |
| **WhatsApp Integration** | Meta Cloud API (axios) | v18.0+ | WhatsApp Business API client | Official Meta Graph API via HTTPS |
| **Telegram Integration** | node-telegram-bot-api | 0.x | Telegram Bot API | Official library |
| **AI/ML** | OpenAI API | 4.x | Intent classification, responses | GPT-4o-mini model |
| **Email** | Gmail API | v1 | Email sending, OAuth | Google APIs Node.js client |
| **PDF Generation** | @react-pdf/renderer | 3.x | PDF document generation | Server-side rendering |
| **Testing (Unit)** | Vitest | 1.x | Fast unit test runner | Vite-native |
| **Testing (E2E)** | Playwright | 1.x | Browser automation | Cross-browser testing |
| **Testing (React)** | @testing-library/react | 14.x | React component testing | With Vitest |
| **Code Quality** | ESLint | 8.x | Linting, code standards | TypeScript-aware |
| **Code Formatting** | Prettier | 3.x | Consistent code style | With Tailwind plugin |
| **Error Tracking** | Sentry | 7.x | Error monitoring | Performance monitoring included |
| **Deployment** | Vercel | Latest | Serverless hosting, CI/CD | Edge network, preview deploys |
| **Version Control** | Git + GitHub | Latest | Source control, collaboration | GitHub Actions for CI/CD |

**CRITICAL NOTE**: WhatsApp integration uses **Meta Cloud API** (official WhatsApp Business API via HTTPS), NOT `@whiskeysockets/baileys` which is for unofficial WhatsApp Web scraping.

---
