# 10. Frontend Architecture

## 10.1 Tech Stack

- **Framework**: Next.js 14+ App Router
- **UI Library**: React 18+ (Server + Client Components)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand (client state only)
- **Forms**: React Hook Form + Zod validation
- **API Client**: tRPC client with React hooks

## 10.2 App Router Structure

```
apps/web/src/app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx           # Login page
│   └── layout.tsx             # Auth layout (centered, no nav)
├── (dashboard)/
│   ├── dashboard/
│   │   └── page.tsx           # Dashboard home
│   ├── agents/
│   │   ├── page.tsx           # Agents list
│   │   ├── [id]/
│   │   │   └── page.tsx       # Agent detail
│   │   └── new/
│   │       └── page.tsx       # Create agent
│   ├── conversations/
│   │   ├── page.tsx           # Conversations list
│   │   └── [id]/
│   │       └── page.tsx       # Conversation viewer
│   ├── documents/
│   │   ├── page.tsx           # Documents list
│   │   └── templates/
│   │       └── page.tsx       # Template management
│   ├── listings/
│   │   ├── page.tsx           # Listings list
│   │   └── [id]/
│   │       └── page.tsx       # Listing detail
│   ├── calculators/
│   │   └── page.tsx           # Calculator management
│   ├── emails/
│   │   └── page.tsx           # Email logs
│   ├── metrics/
│   │   └── page.tsx           # Metrics dashboard
│   └── layout.tsx             # Dashboard layout (sidebar, nav)
├── api/
│   ├── webhooks/
│   │   ├── whatsapp/
│   │   │   └── route.ts       # WhatsApp webhook
│   │   └── telegram/
│   │       └── route.ts       # Telegram webhook
│   ├── trpc/
│   │   └── [trpc]/
│   │       └── route.ts       # tRPC handler
│   └── health/
│       └── route.ts           # Health check
├── layout.tsx                 # Root layout
└── page.tsx                   # Landing page
```

## 10.3 Component Structure

```
apps/web/src/components/
├── ui/                        # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── form.tsx
│   ├── table.tsx
│   └── ...
├── agents/
│   ├── agent-list.tsx         # Agent table with search, filters
│   ├── agent-card.tsx         # Agent summary card
│   ├── agent-form.tsx         # Create/edit agent form
│   └── agent-stats.tsx        # Agent statistics widget
├── conversations/
│   ├── conversation-list.tsx  # List of conversations
│   ├── conversation-viewer.tsx # Message history viewer
│   └── message-bubble.tsx     # Individual message
├── documents/
│   ├── document-list.tsx      # Document generations list
│   ├── template-selector.tsx  # Template picker
│   └── document-preview.tsx   # PDF preview
├── listings/
│   ├── listing-list.tsx       # Listings table
│   ├── listing-card.tsx       # Listing summary card
│   └── listing-photos.tsx     # Photo gallery
├── calculators/
│   ├── calculator-list.tsx    # Calculator definitions
│   └── calculator-form.tsx    # Calculator input form
├── emails/
│   ├── email-log-list.tsx     # Email history
│   └── email-template-form.tsx # Template editor
├── metrics/
│   ├── metrics-dashboard.tsx  # Main metrics display
│   ├── kpi-card.tsx           # KPI widget
│   └── external-api-health.tsx # API health status
└── layout/
    ├── sidebar.tsx            # Dashboard sidebar
    ├── navbar.tsx             # Top navigation
    └── error-boundary.tsx     # Error boundary wrapper
```

## 10.4 State Management (Zustand)

```typescript
// apps/web/src/stores/use-dashboard-store.ts

import { create } from 'zustand';

interface DashboardState {
  sidebarOpen: boolean;
  selectedAgentId: string | null;

  setSidebarOpen: (open: boolean) => void;
  setSelectedAgentId: (id: string | null) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  sidebarOpen: true,
  selectedAgentId: null,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSelectedAgentId: (id) => set({ selectedAgentId: id }),
}));
```

## 10.5 tRPC Client Setup

```typescript
// apps/web/src/trpc/client.ts

import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/server/api/root';

export const trpc = createTRPCReact<AppRouter>();

// apps/web/src/app/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc } from '@/trpc/client';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

---
