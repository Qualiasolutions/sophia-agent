# Telegram Integration API Documentation

## Overview

This document provides comprehensive technical documentation for Sophia AI's Telegram integration, covering all services, endpoints, database schema, and implementation details.

---

## Table of Contents

1. [Services](#services)
2. [Webhook Endpoints](#webhook-endpoints)
3. [Database Schema](#database-schema)
4. [Type Definitions](#type-definitions)
5. [Error Handling](#error-handling)
6. [Security](#security)
7. [Rate Limiting](#rate-limiting)
8. [Testing](#testing)

---

## Services

### TelegramService

Core service for interacting with Telegram Bot API.

**Location:** `packages/services/src/telegram.service.ts`

#### Methods

##### `sendMessage(chatId: number, text: string, options?: SendMessageOptions): Promise<TelegramMessage>`

Send a text message to a Telegram chat.

**Parameters:**
- `chatId` (number): Telegram chat ID
- `text` (string): Message text content
- `options` (SendMessageOptions, optional):
  - `parse_mode`: 'Markdown' | 'HTML' | 'MarkdownV2'
  - `reply_to_message_id`: number
  - `disable_notification`: boolean

**Returns:** Promise<TelegramMessage>

**Example:**
```typescript
import { getTelegramService } from '@sophiaai/services';

const telegramService = getTelegramService();

await telegramService.sendMessage(
  123456789,
  '*Welcome!* This is a _formatted_ message',
  { parse_mode: 'Markdown' }
);
```

**Error Handling:**
- Throws `Error` with message "Telegram API error: {description}" on API failure
- Implements exponential backoff retry (3 attempts, 1s initial delay)

---

##### `setWebhook(url: string, secretToken?: string): Promise<boolean>`

Configure webhook URL for receiving Telegram updates.

**Parameters:**
- `url` (string): HTTPS webhook endpoint URL
- `secretToken` (string, optional): Secret token for webhook validation

**Returns:** Promise<boolean> - true if successful

**Example:**
```typescript
await telegramService.setWebhook(
  'https://sophia-agent.vercel.app/api/telegram-webhook',
  'your-secret-token'
);
```

---

##### `getWebhookInfo(): Promise<WebhookInfo>`

Retrieve current webhook configuration.

**Returns:** Promise<WebhookInfo>

**Example:**
```typescript
const info = await telegramService.getWebhookInfo();
console.log('Pending updates:', info.pending_update_count);
```

---

##### `deleteWebhook(): Promise<boolean>`

Remove webhook configuration (useful for testing/cleanup).

**Returns:** Promise<boolean>

---

##### `static validateWebhookSignature(secretToken: string, receivedToken?: string): boolean`

Validate webhook request signature.

**Parameters:**
- `secretToken` (string): Expected secret token
- `receivedToken` (string | undefined): Received token from request header

**Returns:** boolean

**Example:**
```typescript
const isValid = TelegramService.validateWebhookSignature(
  process.env.TELEGRAM_WEBHOOK_SECRET,
  request.headers.get('X-Telegram-Bot-Api-Secret-Token')
);
```

---

### TelegramAuthService

Handles user authentication and registration.

**Location:** `packages/services/src/telegram-auth.service.ts`

#### Methods

##### `isUserRegistered(telegramUserId: number): Promise<boolean>`

Check if a Telegram user is registered.

**Parameters:**
- `telegramUserId` (number): Telegram user ID

**Returns:** Promise<boolean>

**Example:**
```typescript
import { getTelegramAuthService } from '@sophiaai/services';

const authService = getTelegramAuthService();
const isRegistered = await authService.isUserRegistered(123456789);
```

---

##### `getTelegramUser(telegramUserId: number): Promise<TelegramUserDB | null>`

Retrieve Telegram user record.

**Parameters:**
- `telegramUserId` (number): Telegram user ID

**Returns:** Promise<TelegramUserDB | null>

**Example:**
```typescript
const user = await authService.getTelegramUser(123456789);
if (user) {
  console.log('Agent ID:', user.agent_id);
  console.log('Username:', user.telegram_username);
}
```

---

##### `getAgentByEmail(email: string): Promise<{ id: string; email: string } | null>`

Find agent by email address.

**Parameters:**
- `email` (string): Agent email (automatically normalized to lowercase)

**Returns:** Promise<{ id: string; email: string } | null>

**Example:**
```typescript
const agent = await authService.getAgentByEmail('john.doe@zyprus.com');
if (agent) {
  console.log('Found agent:', agent.id);
}
```

---

##### `registerTelegramUser(params: RegisterParams): Promise<TelegramUserDB>`

Register a new Telegram user.

**Parameters (RegisterParams):**
- `telegramUserId` (number): Telegram user ID
- `chatId` (number): Telegram chat ID
- `agentId` (string): Agent UUID
- `username` (string, optional): Telegram username
- `firstName` (string, optional): User's first name
- `lastName` (string, optional): User's last name

**Returns:** Promise<TelegramUserDB>

**Example:**
```typescript
const newUser = await authService.registerTelegramUser({
  telegramUserId: 123456789,
  chatId: 987654321,
  agentId: 'agent-uuid',
  username: 'johndoe',
  firstName: 'John',
  lastName: 'Doe',
});
```

---

##### `updateLastActive(telegramUserId: number): Promise<void>`

Update user's last active timestamp.

**Parameters:**
- `telegramUserId` (number): Telegram user ID

**Example:**
```typescript
await authService.updateLastActive(123456789);
```

---

##### `deactivateTelegramUser(telegramUserId: number): Promise<void>`

Deactivate a Telegram user account.

**Parameters:**
- `telegramUserId` (number): Telegram user ID

**Example:**
```typescript
await authService.deactivateTelegramUser(123456789);
```

---

##### `static validateEmail(email: string): boolean`

Validate email format.

**Parameters:**
- `email` (string): Email address to validate

**Returns:** boolean

**Example:**
```typescript
const isValid = TelegramAuthService.validateEmail('user@example.com');
// true

const isInvalid = TelegramAuthService.validateEmail('invalid-email');
// false
```

---

### MessageForwardService

Handles cross-platform message forwarding.

**Location:** `packages/services/src/message-forward.service.ts`

#### Methods

##### `forwardToWhatsApp(params: ForwardParams): Promise<ForwardResult>`

Forward message from Telegram to WhatsApp.

**Parameters (ForwardParams):**
- `agentId` (string): Agent UUID
- `telegramChatId` (string): Telegram chat ID
- `recipientPhone` (string): WhatsApp recipient phone (international format)
- `message` (string): Message content
- `messageType` ('text' | 'photo' | 'document', optional): Default 'text'

**Returns:** Promise<ForwardResult>
- `success` (boolean): Whether forward succeeded
- `error` (string, optional): Error message if failed

**Example:**
```typescript
import { getMessageForwardService } from '@sophiaai/services';

const forwardService = getMessageForwardService();

const result = await forwardService.forwardToWhatsApp({
  agentId: 'agent-uuid',
  telegramChatId: '123456',
  recipientPhone: '+35799123456',
  message: 'Hello from Telegram!',
  messageType: 'text',
});

if (result.success) {
  console.log('Message forwarded successfully');
} else {
  console.error('Forward failed:', result.error);
}
```

---

##### `getForwardHistory(agentId: string, limit = 50): Promise<MessageForward[]>`

Retrieve forwarding history for an agent.

**Parameters:**
- `agentId` (string): Agent UUID
- `limit` (number, optional): Max results (default 50)

**Returns:** Promise<MessageForward[]>

**Example:**
```typescript
const history = await forwardService.getForwardHistory('agent-uuid', 10);
history.forEach(forward => {
  console.log(`${forward.source_platform} → ${forward.destination_platform}`);
  console.log(`Status: ${forward.forward_status}`);
});
```

---

##### `static parseForwardCommand(text: string): ForwardCommand`

Parse forward command from message text.

**Parameters:**
- `text` (string): Message text

**Returns:** ForwardCommand
- `isForwardCommand` (boolean): Whether text is a forward command
- `recipient` (string, optional): Recipient phone number
- `message` (string, optional): Message content

**Supported Formats:**
1. `forward to +phone: message`
2. `/forward +phone message`

**Example:**
```typescript
const cmd1 = MessageForwardService.parseForwardCommand(
  'forward to +35799123456: Test message'
);
// { isForwardCommand: true, recipient: '+35799123456', message: 'Test message' }

const cmd2 = MessageForwardService.parseForwardCommand(
  '/forward 35799123456 Another message'
);
// { isForwardCommand: true, recipient: '35799123456', message: 'Another message' }

const cmd3 = MessageForwardService.parseForwardCommand(
  'Normal conversation'
);
// { isForwardCommand: false }
```

---

##### `static validatePhoneNumber(phone: string): boolean`

Validate phone number format.

**Parameters:**
- `phone` (string): Phone number to validate

**Returns:** boolean

**Supported Formats:**
- Cyprus: `+357XXXXXXXX`, `357XXXXXXXX`
- International: `+1-15 digits`
- Handles spaces and dashes

**Example:**
```typescript
MessageForwardService.validatePhoneNumber('+35799123456'); // true
MessageForwardService.validatePhoneNumber('35799123456'); // true
MessageForwardService.validatePhoneNumber('+357 99 123456'); // true
MessageForwardService.validatePhoneNumber('123'); // false
```

---

## Webhook Endpoints

### POST /api/telegram-webhook

Main webhook endpoint for receiving Telegram updates.

**Location:** `apps/web/src/app/api/telegram-webhook/route.ts`

#### Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| `X-Telegram-Bot-Api-Secret-Token` | Yes | Webhook signature validation |
| `Content-Type` | Yes | `application/json` |

#### Request Body

Telegram Update object (see [Telegram Bot API](https://core.telegram.org/bots/api#update))

**Example:**
```json
{
  "update_id": 123456,
  "message": {
    "message_id": 1,
    "from": {
      "id": 987654321,
      "is_bot": false,
      "first_name": "John",
      "username": "johndoe"
    },
    "chat": {
      "id": 987654321,
      "type": "private"
    },
    "date": 1634567890,
    "text": "Hello Sophia!"
  }
}
```

#### Response

**Success (200 OK):**
```json
{
  "ok": true
}
```

**Unauthorized (401):**
```json
{
  "error": "Unauthorized"
}
```

**Server Error (500):**
```json
{
  "error": "Internal server error"
}
```

#### Processing Flow

1. **Signature Validation**
   - Validate `X-Telegram-Bot-Api-Secret-Token` header
   - Reject if invalid (401 Unauthorized)

2. **Async Processing**
   - Acknowledge webhook immediately (200 OK)
   - Process update asynchronously to avoid Telegram timeout

3. **User Authentication**
   - Check if user is registered
   - If not, initiate registration flow
   - If registered, proceed with message processing

4. **Command Detection**
   - Check for forward command
   - If forward: Execute message forwarding
   - If not: Process as AI conversation

5. **Response Logging**
   - Log inbound message to `conversation_logs`
   - Generate AI response
   - Log outbound message to `conversation_logs`

---

### GET /api/telegram-webhook

Health check endpoint.

**Response:**
```json
{
  "status": "Telegram webhook endpoint is active",
  "timestamp": "2025-10-05T00:00:00.000Z"
}
```

---

## Database Schema

### `telegram_users`

Stores Telegram user registrations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | User ID |
| `agent_id` | UUID | FOREIGN KEY → agents(id) | Linked agent |
| `telegram_user_id` | BIGINT | UNIQUE, NOT NULL | Telegram user ID |
| `telegram_username` | TEXT | | Telegram @username |
| `telegram_first_name` | TEXT | | User's first name |
| `telegram_last_name` | TEXT | | User's last name |
| `chat_id` | BIGINT | NOT NULL | Telegram chat ID |
| `is_active` | BOOLEAN | DEFAULT true | Account status |
| `registered_at` | TIMESTAMPTZ | DEFAULT NOW() | Registration timestamp |
| `last_active_at` | TIMESTAMPTZ | DEFAULT NOW() | Last activity timestamp |

**Indexes:**
- `idx_telegram_users_agent_id` on `agent_id`
- `idx_telegram_users_telegram_user_id` on `telegram_user_id`
- `idx_telegram_users_chat_id` on `chat_id`

**Constraints:**
- `unique_telegram_user_per_agent`: UNIQUE(agent_id, telegram_user_id)
- CASCADE DELETE on agent removal

**RLS Policy:**
- Service role has full access

---

### `message_forwards`

Audit log for cross-platform message forwarding.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Forward ID |
| `agent_id` | UUID | FOREIGN KEY → agents(id) | Agent who forwarded |
| `source_platform` | TEXT | CHECK ('telegram', 'whatsapp') | Source platform |
| `source_chat_id` | TEXT | NOT NULL | Source chat identifier |
| `destination_platform` | TEXT | CHECK ('telegram', 'whatsapp') | Destination platform |
| `destination_identifier` | TEXT | NOT NULL | Destination phone/chat |
| `message_content` | TEXT | | Message text |
| `message_type` | TEXT | CHECK ('text', 'photo', 'document') | Message type |
| `forward_status` | TEXT | CHECK ('pending', 'sent', 'failed') | Forward status |
| `error_message` | TEXT | | Error details if failed |
| `forwarded_at` | TIMESTAMPTZ | DEFAULT NOW() | Forward timestamp |

**Indexes:**
- `idx_message_forwards_agent_id` on `agent_id`
- `idx_message_forwards_status` on `forward_status`

**Constraints:**
- `valid_platforms`: source_platform != destination_platform

**RLS Policy:**
- Service role has full access

---

### `conversation_logs` (Updated)

Enhanced to support Telegram conversations.

**New Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `telegram_chat_id` | BIGINT | Telegram chat ID |
| `telegram_message_id` | INTEGER | Telegram message ID |

**Index:**
- `idx_conversation_logs_telegram_chat` on `telegram_chat_id`

---

## Type Definitions

### TelegramUpdate

```typescript
interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}
```

### TelegramMessage

```typescript
interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  photo?: TelegramPhotoSize[];
  document?: TelegramDocument;
  reply_to_message?: TelegramMessage;
}
```

### TelegramUserDB

```typescript
interface TelegramUserDB {
  id: string;
  agent_id: string;
  telegram_user_id: number;
  telegram_username?: string;
  telegram_first_name?: string;
  telegram_last_name?: string;
  chat_id: number;
  is_active: boolean;
  registered_at: string;
  last_active_at: string;
}
```

### MessageForward

```typescript
interface MessageForward {
  id: string;
  agent_id: string;
  source_platform: 'telegram' | 'whatsapp';
  source_chat_id: string;
  destination_platform: 'telegram' | 'whatsapp';
  destination_identifier: string;
  message_content?: string;
  message_type: 'text' | 'photo' | 'document';
  forward_status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  forwarded_at: string;
}
```

---

## Error Handling

### Service-Level Errors

**TelegramService:**
- Implements retry logic with exponential backoff
- Max 3 retries with delays: 1s, 2s, 4s
- Throws `Error` with descriptive messages

**TelegramAuthService:**
- Throws `Error` on database failures
- Returns `null` for not-found cases (PGRST116)

**MessageForwardService:**
- Returns `ForwardResult` with success flag and error message
- Logs all failures to database for audit

### Webhook Error Handling

**Authentication Errors:**
```
401 Unauthorized - Invalid webhook signature
```

**Processing Errors:**
```
500 Internal Server Error - Unexpected error during processing
```

**User-Facing Errors:**
```
❌ An error occurred while processing your request. Please try again later.
```

---

## Security

### Webhook Signature Validation

All webhook requests must include valid secret token:

```typescript
const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;
const receivedToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token');

if (!TelegramService.validateWebhookSignature(secretToken, receivedToken)) {
  return new Response('Unauthorized', { status: 401 });
}
```

### Environment Variables

Required environment variables:

```bash
TELEGRAM_BOT_TOKEN=7366078137:AAF49KYdNYZKAbMQQ_42bbltU3oCChrs5qM
TELEGRAM_WEBHOOK_SECRET=your-secret-token
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Data Protection

- All Telegram user data encrypted in transit (HTTPS)
- Database RLS policies restrict access to service role
- Conversation logs stored securely in Supabase
- No sensitive data in error messages

---

## Rate Limiting

### Telegram Bot API Limits

- **Messages:** 30 messages/second per bot
- **Group messages:** 20 messages/minute per group
- **Same user:** No specific limit, but avoid spam

### Implementation Recommendations

```typescript
// Future: Implement rate limiting middleware
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
});
```

---

## Testing

### Unit Tests

Test files located in `__tests__/` directories:

- `telegram.service.test.ts`
- `telegram-auth.service.test.ts`
- `message-forward.service.test.ts`
- `telegram-webhook/__tests__/route.test.ts`

**Run tests:**
```bash
# Service tests
cd packages/services
npm run test

# Webhook tests
cd apps/web
npm run test
```

### Manual Testing

**Webhook Testing:**
```bash
curl -X POST https://sophia-agent.vercel.app/api/telegram-webhook \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: your-secret" \
  -d '{
    "update_id": 123,
    "message": {
      "message_id": 1,
      "from": {"id": 123456, "first_name": "Test"},
      "chat": {"id": 123456, "type": "private"},
      "date": 1634567890,
      "text": "test"
    }
  }'
```

**Forward Testing:**
```
Message bot: forward to +35799123456: Test message
```

---

## Deployment

### Vercel Deployment

1. **Add environment variables:**
   ```bash
   vercel env add TELEGRAM_BOT_TOKEN
   vercel env add TELEGRAM_WEBHOOK_SECRET
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Register webhook:**
   ```bash
   node scripts/setup-telegram-webhook.ts
   ```

### Database Migration

Apply migration to Supabase:

```bash
psql -h db.supabase.co -U postgres -d postgres \
  < packages/database/supabase/migrations/010_create_telegram_users.sql
```

Or use Supabase dashboard:
1. Go to SQL Editor
2. Paste migration SQL
3. Run

---

## Support & Maintenance

### Monitoring

Monitor these metrics:
- Webhook success rate
- Message processing time
- Forward success rate
- Registration conversion rate
- Error rates by type

### Logging

All services log to console:
- Info: Successful operations
- Warn: Retries
- Error: Failures with stack traces

### Debugging

Enable debug logs:
```bash
DEBUG=telegram:* npm run dev
```

---

**Last Updated:** October 2025
**Version:** 1.0
**Maintainer:** Sophia AI Team
