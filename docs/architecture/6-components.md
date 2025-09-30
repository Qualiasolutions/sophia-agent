# 6. Components

## 6.1 Service Layer Architecture

All business logic is encapsulated in service classes in `packages/services/src/`:

```
packages/services/src/
├── conversation.service.ts     # Message processing, intent classification
├── document.service.ts         # Document generation, template rendering
├── listing.service.ts          # Listing data collection, upload
├── calculator.service.ts       # Calculator execution, history
├── email.service.ts            # Email composition, scheduling, sending
├── whatsapp.service.ts         # WhatsApp API wrapper
├── telegram.service.ts         # Telegram API wrapper
├── openai.service.ts           # OpenAI API wrapper, prompt management
└── monitoring/
    ├── metrics.service.ts      # Custom metrics collection
    └── alerts.service.ts       # Alert dispatching
```

## 6.2 Repository Pattern

Data access is abstracted through Supabase client:

```typescript
// packages/services/src/repositories/agent.repository.ts

export class AgentRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<Agent | null> {
    const { data, error } = await this.supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new DatabaseError('findById', error);
    return data;
  }

  async findByPhoneNumber(phoneNumber: string): Promise<Agent | null> {
    const { data, error } = await this.supabase
      .from('agents')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new DatabaseError('findByPhoneNumber', error);
    }
    return data;
  }

  async create(input: CreateAgentInput): Promise<Agent> {
    const { data, error } = await this.supabase
      .from('agents')
      .insert({
        phone_number: input.phoneNumber,
        name: input.name,
        email: input.email,
      })
      .select()
      .single();

    if (error) throw new DatabaseError('create', error);
    return data;
  }
}
```

## 6.3 Dependency Injection

Services are instantiated with their dependencies:

```typescript
// apps/web/src/server/api/services.ts

import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';
import { ConversationService } from '@sophiaai/services/conversation.service';
import { OpenAIService } from '@sophiaai/services/openai.service';
import { WhatsAppService } from '@sophiaai/services/whatsapp.service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const redis = Redis.fromEnv();

const openai = new OpenAIService(process.env.OPENAI_API_KEY!);
const whatsapp = new WhatsAppService({
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
});

export const conversationService = new ConversationService(
  supabase,
  redis,
  openai,
  whatsapp
);
```

---
