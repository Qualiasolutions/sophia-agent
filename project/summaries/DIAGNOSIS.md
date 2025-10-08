# WhatsApp Message Response Issue - Diagnosis & Fix

## Problem
Messages sent from **+35799111668** to Sophia via WhatsApp are NOT receiving responses.

## Root Cause Analysis

### ✅ What's Working
1. **Agent Registration**: +35799111668 IS registered in database as "Agent Four" (active)
2. **Webhook Receiving**: 3 inbound messages logged in `conversation_logs` table:
   - "Hi" at 2025-09-30T21:06:29
   - "Hi" at 2025-09-30T21:08:36
   - "Hu" at 2025-09-30T21:08:43
3. **Vercel Deployment**: Latest deployment healthy (https://sophia-agent-i48ascmxu-qualiasolutionscy.vercel.app)
4. **Environment Variables**: All required vars configured in Vercel (OpenAI, Twilio, Supabase)

### ❌ What's NOT Working
1. **No Outbound Responses**: Zero outbound messages in `conversation_logs` for this agent
2. **Missing Database Column**: `delivery_status` column doesn't exist in production database
   - This causes the webhook handler to crash when trying to log outbound messages
   - Error prevents WhatsAppService from completing message send operation
3. **SECURITY VULNERABILITY**: Row Level Security (RLS) NOT enabled on `conversation_logs` table
   - **CRITICAL**: All conversation data is publicly accessible via PostgREST API
   - Anyone with your Supabase URL can read all agent conversations
   - This is a data breach risk and must be fixed immediately

## Critical Issue

**The webhook code attempts to access `delivery_status` column that doesn't exist in production!**

```typescript
// In whatsapp.service.ts:182-229 and route.ts:66-119
// Code tries to update/read delivery_status column
```

When the query fails, the entire message sending flow crashes silently.

## Fix Instructions

### Step 1: Apply Missing Database Migrations

Run these SQL commands in **Supabase SQL Editor** (https://supabase.com/dashboard/project/zmwgoagpxefdruyhkfoh/sql):

#### Migration 003: Add delivery_status column
```sql
ALTER TABLE conversation_logs
ADD COLUMN delivery_status TEXT CHECK (
  delivery_status IN ('queued', 'sent', 'delivered', 'read', 'failed', 'undelivered')
);

CREATE INDEX idx_conversation_logs_delivery_status ON conversation_logs(delivery_status);

COMMENT ON COLUMN conversation_logs.delivery_status IS 'Message delivery status from Twilio/WhatsApp webhooks: queued, sent, delivered, read, failed, undelivered';
```

#### Migration 004: Allow null agent_id for unregistered attempts
```sql
ALTER TABLE conversation_logs
  ALTER COLUMN agent_id DROP NOT NULL;

COMMENT ON COLUMN conversation_logs.agent_id IS 'Foreign key to agents table. NULL for unregistered agent attempts.';
```

#### Migration 005: Enable RLS for security (CRITICAL)
```sql
-- Enable Row Level Security on conversation_logs
ALTER TABLE conversation_logs ENABLE ROW LEVEL SECURITY;

-- Service role has full access (for API operations)
CREATE POLICY "Service role has full access" ON conversation_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Agents can view their own conversation logs
CREATE POLICY "Agents can view own logs" ON conversation_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = agent_id::text);

-- Note: Admin policy will be added when admin_users table is created

COMMENT ON TABLE conversation_logs IS 'Conversation logs with RLS enabled. Service role has full access for API operations, agents can view own logs.';
```

### Step 2: Verify Twilio Webhook URL

1. Go to Twilio Console: https://console.twilio.com
2. Navigate to: Messaging → Try it out → Send a WhatsApp message
3. Click on "Sandbox Settings"
4. Verify "WHEN A MESSAGE COMES IN" webhook URL is set to:
   ```
   https://sophia-agent-i48ascmxu-qualiasolutionscy.vercel.app/api/whatsapp-webhook
   ```
   Or your production domain if you have one configured

5. Ensure HTTP Method is **POST**
6. Save settings

### Step 3: Test the Fix

1. Send a new test message from +35799111668:
   ```
   Hello Sophia
   ```

2. You should receive a response within 5 seconds that looks like:
   ```
   Hi! I'm Sophia, your zyprus.com AI assistant. I can help with documents,
   listings, calculations, and emails. What can I assist you with today?
   ```

3. Verify in Supabase `conversation_logs` table:
   - New inbound entry with direction='inbound'
   - New outbound entry with direction='outbound'
   - Both should have `delivery_status` values

## Technical Details

### Why Messages Weren't Sent

1. Webhook receives message → ✅ Works
2. Logs inbound message → ✅ Works (agent_id required, which exists)
3. OpenAI generates response → ✅ Should work (env vars configured)
4. WhatsAppService sends message → ❌ **FAILS HERE**
5. Try to log outbound message with delivery_status → ❌ **Column doesn't exist**
6. Database error crashes the async process → ❌ **Silent failure**
7. Agent never receives response → ❌ **User sees nothing**

### Database Schema Mismatch

**Local Development** (working):
- Has all 4 migrations applied
- `delivery_status` column exists
- Tests pass

**Production** (broken):
- Only migrations 001 and 002 applied
- Missing migration 003 (delivery_status)
- Missing migration 004 (nullable agent_id)
- Code expects columns that don't exist

## Prevention

For future deployments:

1. **Always apply migrations before deploying code changes**
2. **Add migration status check to CI/CD pipeline**
3. **Create Supabase migration tracking table** to know which migrations are applied
4. **Test on production-like database** before deploying

## Next Steps After Fix

1. Monitor Vercel logs for webhook hits
2. Check Supabase conversation_logs for new entries
3. Verify delivery_status updates from Twilio status callbacks
4. Complete manual testing checklist from Story 1.6
