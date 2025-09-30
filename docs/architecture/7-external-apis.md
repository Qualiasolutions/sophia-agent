# 7. External APIs

## 7.1 WhatsApp Business API (Meta Cloud API)

**Base URL**: `https://graph.facebook.com/v18.0`
**Authentication**: Bearer token
**Rate Limits**: Unknown (monitor in production)

**Key Endpoints**:
- `POST /{phone_number_id}/messages` - Send messages
- Webhook: `POST /api/webhooks/whatsapp` - Receive messages

**Implementation**: `packages/services/src/whatsapp.service.ts`

## 7.2 Telegram Bot API

**Base URL**: `https://api.telegram.org/bot{token}`
**Authentication**: Bot token in URL
**Rate Limits**: 30 messages/second

**Key Endpoints**:
- `POST /sendMessage` - Send messages
- Webhook: `POST /api/webhooks/telegram` - Receive updates

**Implementation**: `packages/services/src/telegram.service.ts`

## 7.3 OpenAI API

**Base URL**: `https://api.openai.com/v1`
**Authentication**: Bearer token
**Rate Limits**: 10,000 requests/min (tier-based)

**Model**: `gpt-4o-mini`
**Use Cases**:
- Intent classification
- Response generation
- Data extraction

**Implementation**: `packages/services/src/openai.service.ts`

## 7.4 Gmail API

**Base URL**: `https://gmail.googleapis.com/gmail/v1`
**Authentication**: OAuth 2.0
**Rate Limits**: 1 billion quota units/day

**Key Operations**:
- Send email
- Manage forwarding rules
- Access mailbox

**Implementation**: `packages/services/src/email.service.ts`

## 7.5 zyprus.com API

**Status**: 🔴 **BLOCKED** - API documentation not available
**Required Actions**:
1. Schedule discovery meeting (Week 1)
2. Obtain API documentation
3. Get test account credentials
4. Implement integration

**Expected Endpoints**:
- `POST /api/listings` - Create listing
- `PUT /api/listings/{id}` - Update listing
- `GET /api/listings/{id}` - Get listing details

**Fallback Plan**: Manual CSV export for MVP

---
