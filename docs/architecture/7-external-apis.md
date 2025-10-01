# 7. External APIs

## 7.1 WhatsApp Business API

⚠️ **Current Status**: Using **Twilio WhatsApp Sandbox API** temporarily (see below)

### Target: Meta WhatsApp Cloud API

**Base URL**: `https://graph.facebook.com/v18.0`
**Authentication**: Bearer token
**Rate Limits**: Unknown (monitor in production)
**Status**: Pending business verification (2-4 weeks)

**Key Endpoints**:
- `POST /{phone_number_id}/messages` - Send messages
- Webhook: `POST /api/webhooks/whatsapp` - Receive messages

**Implementation**: `packages/services/src/whatsapp.service.ts`

### Current: Twilio WhatsApp Sandbox API (Temporary)

**Base URL**: `https://api.twilio.com/2010-04-01`
**Authentication**: Account SID + Auth Token (HTTP Basic Auth)
**Rate Limits**: Generous (exact limits TBD)
**Status**: ✅ Active (Story 1.3)

**Environment Variables**:
```bash
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_WHATSAPP_NUMBER=+14155238886  # Twilio sandbox number
```

**Webhook Endpoint**:
- `POST /api/whatsapp-webhook` - Receives form-urlencoded data from Twilio

**Key Differences from Meta**:
- Payload format: Form-urlencoded (`Body`, `From`, `MessageSid`) vs JSON
- No verification endpoint needed (no `hub.verify_token` pattern)
- Phone numbers include `whatsapp:` prefix that must be stripped
- Sandbox limitations: Users must join via "join <code>" message first

**Implementation**: `apps/web/src/app/api/whatsapp-webhook/route.ts`

**Migration Timeline**: Switch to Meta Cloud API when business verification completes (estimated 2-4 weeks from Story 1.1)

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
