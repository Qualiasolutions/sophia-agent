# Twilio WhatsApp Sandbox → Meta Cloud API Migration Guide

**Status**: 📋 Planning (execute when Meta business verification completes)
**Related Story**: Story 1.3 (implemented with Twilio temporarily)
**Target Story**: TBD (create when ready to migrate)

## Why This Migration?

Story 1.3 was implemented using Twilio WhatsApp Sandbox API as a temporary solution while waiting for Meta WhatsApp Business verification (2-4 weeks). Once Meta verification completes, we'll migrate to the official Meta Cloud API for:

- ✅ Production-grade reliability (no sandbox limitations)
- ✅ No "join code" requirement for users
- ✅ Higher rate limits and official support
- ✅ Access to advanced WhatsApp Business features

## Key Differences: Twilio vs Meta

| Aspect | Twilio Sandbox (Current) | Meta Cloud API (Target) |
|--------|--------------------------|-------------------------|
| **Payload Format** | Form-urlencoded | JSON |
| **Verification** | None | GET endpoint with `hub.verify_token` |
| **Phone Format** | `whatsapp:+1234567890` | `+1234567890` |
| **Message ID Field** | `MessageSid` | `wamid.xxxxx` |
| **Body Field** | `Body` | `entry[0].changes[0].value.messages[0].text.body` |
| **From Field** | `From` | `entry[0].changes[0].value.messages[0].from` |
| **Timestamp** | `timestamp` (Unix) | `entry[0].changes[0].value.messages[0].timestamp` (Unix string) |

## Migration Checklist

### Pre-Migration (Meta Setup)

- [ ] Verify Meta Business Account is approved
- [ ] Verify WhatsApp Business App is approved
- [ ] Copy credentials from Meta Developer Dashboard:
  - `WHATSAPP_BUSINESS_ACCOUNT_ID`
  - `WHATSAPP_ACCESS_TOKEN`
  - `WHATSAPP_PHONE_NUMBER_ID`
- [ ] Generate secure random string for `WHATSAPP_WEBHOOK_VERIFY_TOKEN` (min 32 chars)

### Code Changes

#### 1. Update Environment Variables

**Remove:**
```bash
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_WHATSAPP_NUMBER
```

**Add:**
```bash
WHATSAPP_BUSINESS_ACCOUNT_ID=xxxxx
WHATSAPP_ACCESS_TOKEN=xxxxx
WHATSAPP_PHONE_NUMBER_ID=xxxxx
WHATSAPP_WEBHOOK_VERIFY_TOKEN=<secure_random_32+_chars>
```

#### 2. Add GET Verification Handler

**File**: `/apps/web/src/app/api/whatsapp-webhook/route.ts`

```typescript
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (!verifyToken) {
    console.error('[WhatsApp Webhook] WHATSAPP_WEBHOOK_VERIFY_TOKEN not configured');
    return new Response('Configuration error', { status: 500 });
  }

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WhatsApp Webhook] Webhook verified successfully');
    return new Response(challenge, { status: 200 });
  }

  console.warn('[WhatsApp Webhook] Verification failed', { mode, tokenMatch: token === verifyToken });
  return new Response('Forbidden', { status: 403 });
}
```

#### 3. Update POST Handler Payload Parsing

**Current (Twilio - form-urlencoded):**
```typescript
const formData = await request.formData();
const from = formData.get('From') as string;
const body = formData.get('Body') as string;
const messageSid = formData.get('MessageSid') as string;
```

**Target (Meta - JSON):**
```typescript
const payload = await request.json();
const entry = payload.entry?.[0];
const changes = entry?.changes?.[0];
const value = changes?.value;
const message = value?.messages?.[0];

const from = message?.from;
const body = message?.text?.body;
const messageSid = message?.id;
const timestamp = message?.timestamp;
```

#### 4. Remove Phone Prefix Stripping

**Current (Twilio):**
```typescript
const phoneNumber = from?.replace('whatsapp:', '') || '';
```

**Target (Meta):**
```typescript
const phoneNumber = from || '';  // Already in E.164 format
```

#### 5. Update Tests

**File**: `/apps/web/src/app/api/whatsapp-webhook/__tests__/route.test.ts`

Add GET verification tests:
```typescript
describe('GET /api/whatsapp-webhook (verification)', () => {
  it('should return challenge for valid verify token', async () => {
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = 'test_token';
    const response = await GET(new Request('http://localhost:3000/api/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=test_token&hub.challenge=test_challenge'));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('test_challenge');
  });

  it('should return 403 for invalid verify token', async () => {
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = 'test_token';
    const response = await GET(new Request('http://localhost:3000/api/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=test'));
    expect(response.status).toBe(403);
  });
});
```

Update POST tests to use JSON payload:
```typescript
const metaPayload = {
  object: 'whatsapp_business_account',
  entry: [{
    id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
    changes: [{
      value: {
        messaging_product: 'whatsapp',
        metadata: { phone_number_id: 'PHONE_NUMBER_ID' },
        messages: [{
          from: '+1234567890',
          id: 'wamid.xxxxx',
          timestamp: '1234567890',
          type: 'text',
          text: { body: 'Test message' }
        }]
      }
    }]
  }]
};

const response = await POST(new Request('http://localhost:3000/api/whatsapp-webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(metaPayload)
}));
```

### Deployment & Webhook Registration

1. **Update Vercel environment variables**:
   - Remove Twilio variables
   - Add Meta variables
   - Verify `WHATSAPP_WEBHOOK_VERIFY_TOKEN` is set

2. **Deploy to Vercel**:
   ```bash
   git add .
   git commit -m "feat(whatsapp): migrate from Twilio to Meta Cloud API"
   git push
   ```

3. **Register webhook with Meta**:
   - Go to Meta App Dashboard → Your App → WhatsApp → Configuration
   - Set Callback URL: `https://your-app.vercel.app/api/whatsapp-webhook`
   - Set Verify Token: (same value as `WHATSAPP_WEBHOOK_VERIFY_TOKEN`)
   - Subscribe to webhook fields: `messages`
   - Click "Verify and Save"
   - Meta will send GET request to verify

4. **Test webhook**:
   - Send test WhatsApp message to your Meta WhatsApp number
   - Verify message appears in `conversation_logs` table
   - Check Vercel logs for successful processing

### Rollback Plan

If migration fails, revert to Twilio:

1. Restore Twilio environment variables in Vercel
2. Revert code changes: `git revert <commit-hash>`
3. Redeploy: `git push`
4. Reconfigure Twilio webhook in dashboard

### Testing Checklist

- [ ] GET verification endpoint returns challenge correctly
- [ ] GET verification endpoint rejects invalid tokens
- [ ] POST handler parses Meta JSON payload correctly
- [ ] Phone numbers extracted without prefix stripping
- [ ] Message logged to `conversation_logs` table
- [ ] Registered agent receives message successfully
- [ ] Unregistered agent handled gracefully
- [ ] Duplicate messages deduplicated correctly
- [ ] All 28+ tests passing

## Files to Update

| File | Changes Required |
|------|------------------|
| `apps/web/src/app/api/whatsapp-webhook/route.ts` | Add GET handler, update POST parsing |
| `apps/web/src/app/api/whatsapp-webhook/__tests__/route.test.ts` | Add GET tests, update POST test payloads |
| `apps/web/.env.local` | Replace Twilio vars with Meta vars |
| `apps/web/.env.example` | Update variable placeholders |
| `docs/architecture/7-external-apis.md` | Update to mark Meta as active, Twilio as deprecated |
| `docs/stories/1.3.story.md` | Update status and changelog |

## Estimated Effort

- **Code Changes**: 2-3 hours
- **Testing**: 1-2 hours
- **Deployment & Verification**: 1 hour
- **Total**: 4-6 hours

## Success Criteria

- ✅ GET verification endpoint works (Meta webhook connects)
- ✅ POST handler receives and parses Meta JSON payloads
- ✅ Messages logged to database correctly
- ✅ All tests passing (28+ tests)
- ✅ End-to-end test successful (send WhatsApp message → appears in DB)
- ✅ No Twilio dependencies remaining in code
- ✅ Production deployment successful

---

**When to Execute**: Once Meta business verification email confirms approval (typically 2-4 weeks from initial application)

**Story to Create**: When ready, run `/BMad:agents:sm` and create new story "Story 1.3.1: Migrate WhatsApp Integration from Twilio to Meta Cloud API"
