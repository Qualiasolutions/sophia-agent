# Telegram Integration Setup Guide

This guide covers the deployment and configuration of the Telegram bot integration for SophiaAI.

## ✅ Completed

All 4 Telegram stories have been implemented:

- **Story 6.1**: Telegram Bot Setup & Webhook Integration
- **Story 6.2**: Telegram User Authentication & Registration
- **Story 6.3**: Telegram Message Forwarding (Telegram → WhatsApp)
- **Story 6.4**: Conversational Features (AI responses, document generation, calculators)

## 📋 Deployment Checklist

### 1. Add Environment Variables to Vercel

Navigate to your Vercel project settings and add the following environment variables:

```bash
TELEGRAM_BOT_TOKEN=7366078137:AAF49KYdNYZKAbMQQ_42bbltU3oCChrs5qM
TELEGRAM_WEBHOOK_SECRET=sophiaai-telegram-webhook-secret-2025
```

**Steps:**
1. Go to https://vercel.com/qualiasolutionscy/sophia-agent/settings/environment-variables
2. Add both variables for "Production" environment
3. Trigger a new deployment after adding variables

### 2. Apply Database Migration

The database migration file has been created at:
`packages/database/supabase/migrations/010_create_telegram_users.sql`

**Steps:**
1. Apply migration via Supabase Dashboard or CLI
2. Verify tables created:
   - `telegram_users`
   - `message_forwards`
   - Updated `conversation_logs` with `telegram_chat_id` and `telegram_message_id` columns

### 3. Register Webhook with Telegram

After deployment completes, run the setup script:

```bash
TELEGRAM_BOT_TOKEN=7366078137:AAF49KYdNYZKAbMQQ_42bbltU3oCChrs5qM \
WEBHOOK_URL=https://sophia-agent.vercel.app/api/telegram-webhook \
TELEGRAM_WEBHOOK_SECRET=sophiaai-telegram-webhook-secret-2025 \
npx ts-node scripts/setup-telegram-webhook.ts
```

**Expected Output:**
```
✅ Webhook registered successfully!

📊 Webhook Info:
   URL: https://sophia-agent.vercel.app/api/telegram-webhook
   Has custom certificate: false
   Pending update count: 0

✨ Telegram bot is ready to receive messages!
```

### 4. Test the Integration

**Test Registration Flow:**
1. Open Telegram and search for your bot
2. Send `/start` or any message
3. Bot should ask for your email address
4. Provide an email registered in the `agents` table
5. Bot should confirm registration

**Test Message Forwarding:**
```
forward to +35799123456: Hello from Telegram!
```

**Test AI Conversation:**
```
Calculate transfer duty for a property at €250,000
```

## 📱 Bot Features

### User Registration
- Email-based authentication
- Links Telegram user to existing Sophia agent account
- One-time setup per user

### Message Forwarding
Supports two command formats:

```bash
# Format 1
forward to +35799123456: Your message here

# Format 2
/forward +35799123456 Your message here
```

### AI-Powered Assistance
- Document generation (registration forms, contracts, etc.)
- Real estate calculators (transfer duty, stamp duty, VAT, capital gains tax)
- General real estate queries
- Property listing assistance

### Conversation History
All conversations are logged to `conversation_logs` table with:
- Message content
- Timestamp
- Direction (inbound/outbound)
- Platform (telegram)
- Chat ID and Message ID

## 🔒 Security Features

- **Webhook signature validation** using `TELEGRAM_WEBHOOK_SECRET`
- **Row Level Security (RLS)** on database tables
- **Service role authentication** for database operations
- **Phone number validation** for message forwarding
- **Email validation** for user registration

## 🐛 Troubleshooting

### Webhook Not Receiving Updates

Check webhook status:
```bash
curl https://api.telegram.org/bot7366078137:AAF49KYdNYZKAbMQQ_42bbltU3oCChrs5qM/getWebhookInfo
```

### Registration Not Working

Verify agent exists in database:
```sql
SELECT * FROM agents WHERE email = 'user@example.com' AND status = 'active';
```

### Message Forwarding Fails

Check Twilio/WhatsApp credentials are configured in Vercel environment variables.

## 📊 Database Schema

### `telegram_users` Table
```sql
- id: UUID (primary key)
- agent_id: UUID (references agents.id)
- telegram_user_id: BIGINT (unique)
- telegram_username: TEXT
- telegram_first_name: TEXT
- telegram_last_name: TEXT
- chat_id: BIGINT
- is_active: BOOLEAN
- registered_at: TIMESTAMPTZ
- last_active_at: TIMESTAMPTZ
```

### `message_forwards` Table
```sql
- id: UUID (primary key)
- agent_id: UUID (references agents.id)
- source_platform: TEXT (telegram | whatsapp)
- source_chat_id: TEXT
- destination_platform: TEXT (telegram | whatsapp)
- destination_identifier: TEXT (phone number)
- message_content: TEXT
- message_type: TEXT (text | photo | document)
- forward_status: TEXT (pending | sent | failed)
- error_message: TEXT
- forwarded_at: TIMESTAMPTZ
```

## 🚀 Next Steps

1. ✅ Complete deployment checklist above
2. Test all features thoroughly
3. Monitor logs for any errors
4. Consider implementing:
   - Conversation history loading for context
   - Photo/document forwarding
   - Inline keyboards for common actions
   - User preferences/settings

---

**Bot Token:** `7366078137:AAF49KYdNYZKAbMQQ_42bbltU3oCChrs5qM`
**Webhook URL:** `https://sophia-agent.vercel.app/api/telegram-webhook`
**Production URL:** `https://sophia-agent.vercel.app`
