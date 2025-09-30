# 5. API Specification

## 5.1 API Architecture

**Type**: tRPC (end-to-end type-safe RPC)
**Base URL**: `/api/trpc`
**Authentication**: Supabase Auth (JWT in httpOnly cookie)
**Authorization**: RLS policies + custom middleware

## 5.2 tRPC Router Structure

```typescript
// apps/web/src/server/api/root.ts

export const appRouter = createTRPCRouter({
  agent: agentRouter,
  conversation: conversationRouter,
  document: documentRouter,
  listing: listingRouter,
  calculator: calculatorRouter,
  email: emailRouter,
});

export type AppRouter = typeof appRouter;
```

## 5.3 Agent Router

```typescript
// apps/web/src/server/api/routers/agent.router.ts

export const agentRouter = createTRPCRouter({
  // Queries
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      search: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      // Returns paginated list of agents
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // Returns single agent by ID
    }),

  getStats: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // Returns agent statistics (messages, documents, etc.)
    }),

  // Mutations
  create: adminProcedure
    .input(z.object({
      phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/),
      name: z.string().min(1).max(100),
      email: z.string().email().max(255),
    }))
    .mutation(async ({ input, ctx }) => {
      // Creates new agent
    }),

  update: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(100).optional(),
      email: z.string().email().max(255).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Updates agent
    }),

  deactivate: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Deactivates agent
    }),
});
```

## 5.4 Conversation Router

```typescript
export const conversationRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      agentId: z.string().uuid().optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input, ctx }) => {}),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {}),

  getMessages: protectedProcedure
    .input(z.object({
      conversationId: z.string().uuid(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input, ctx }) => {}),

  getActiveForAgent: protectedProcedure
    .input(z.object({ agentId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {}),
});
```

## 5.5 Document Router

```typescript
export const documentRouter = createTRPCRouter({
  listTemplates: protectedProcedure
    .input(z.object({
      category: z.enum(['contracts', 'marketing', 'legal', 'financial']).optional(),
    }))
    .query(async ({ input, ctx }) => {}),

  listGenerations: protectedProcedure
    .input(z.object({
      agentId: z.string().uuid().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {}),

  getGeneration: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {}),

  regenerate: protectedProcedure
    .input(z.object({ generationId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {}),

  createTemplate: adminProcedure
    .input(z.object({
      name: z.string(),
      category: z.enum(['contracts', 'marketing', 'legal', 'financial']),
      templateContent: z.string(),
      requiredFields: z.array(z.string()),
    }))
    .mutation(async ({ input, ctx }) => {}),
});
```

## 5.6 Listing Router

```typescript
export const listingRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      agentId: z.string().uuid().optional(),
      status: z.enum(['draft', 'ready', 'uploaded']).optional(),
    }))
    .query(async ({ input, ctx }) => {}),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {}),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {}),

  retryUpload: protectedProcedure
    .input(z.object({ listingId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {}),
});
```

## 5.7 Calculator Router

```typescript
export const calculatorRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      isActive: z.boolean().optional(),
    }))
    .query(async ({ input, ctx }) => {}),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {}),

  create: adminProcedure
    .input(z.object({
      name: z.string(),
      description: z.string(),
      formula: z.string(),
      inputFields: z.array(z.object({
        name: z.string(),
        label: z.string(),
        type: z.enum(['number', 'percentage', 'currency']),
        required: z.boolean(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {}),

  update: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
      // ... update fields
    }))
    .mutation(async ({ input, ctx }) => {}),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {}),

  getHistory: protectedProcedure
    .input(z.object({
      agentId: z.string().uuid(),
      calculatorId: z.string().uuid().optional(),
    }))
    .query(async ({ input, ctx }) => {}),

  getStats: protectedProcedure
    .input(z.object({ calculatorId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {}),

  getRecentForAgent: protectedProcedure
    .input(z.object({ agentId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {}),
});
```

## 5.8 Email Router

```typescript
export const emailRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      agentId: z.string().uuid().optional(),
      status: z.enum(['scheduled', 'sent', 'failed']).optional(),
    }))
    .query(async ({ input, ctx }) => {}),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {}),

  getStats: protectedProcedure
    .input(z.object({ agentId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {}),

  retry: protectedProcedure
    .input(z.object({ emailId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {}),

  listForwards: protectedProcedure
    .input(z.object({ agentId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {}),

  getTopTemplates: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input, ctx }) => {}),
});
```

---
