# 11. Backend Architecture

## 11.1 Serverless Functions

All API routes are serverless functions deployed on Vercel:

- **Auto-scaling**: 0 → 1000+ concurrent executions
- **Cold start**: < 500ms
- **Timeout**: 10s (free tier) / 300s (paid tier)
- **Memory**: 1024 MB default

## 11.2 Service Layer

Business logic is in `packages/services/`, not in API routes:

```typescript
// apps/web/src/app/api/webhooks/whatsapp/route.ts

import { conversationService } from '@/server/api/services';

export async function POST(request: Request) {
  // 1. Verify webhook
  // 2. Extract message
  // 3. Delegate to service
  void conversationService.processWhatsAppWebhook(payload);

  // 4. Return immediately
  return new Response('OK', { status: 200 });
}
```

Services contain all logic:

```typescript
// packages/services/src/conversation.service.ts

export class ConversationService {
  async processWhatsAppWebhook(payload: WhatsAppPayload) {
    const message = this.extractMessage(payload);
    await this.processMessage(message.from, message.text);
  }

  async processMessage(agentId: string, text: string) {
    // Full business logic here
  }
}
```

## 11.3 Authentication Flow

```typescript
// apps/web/src/server/auth.ts

import { createServerClient } from '@supabase/ssr';

export async function getServerAuthSession() {
  const supabase = createServerClient(/* ... */);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  // Verify admin user
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', session.user.id)
    .eq('is_active', true)
    .single();

  if (!adminUser) return null;

  return { user: session.user, admin: adminUser };
}
```

## 11.4 tRPC Context

```typescript
// apps/web/src/server/api/trpc.ts

import { initTRPC, TRPCError } from '@trpc/server';
import { getServerAuthSession } from '@/server/auth';

const t = initTRPC.context<Context>().create();

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await getServerAuthSession();

  return {
    session,
    db: supabase,
    redis,
  };
};

// Protected procedure
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({
    ctx: {
      session: ctx.session,
      db: ctx.db,
      redis: ctx.redis,
    },
  });
});

// Admin procedure
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session || !['admin', 'super_admin'].includes(ctx.session.admin.role)) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  return next({ ctx });
});
```

---
