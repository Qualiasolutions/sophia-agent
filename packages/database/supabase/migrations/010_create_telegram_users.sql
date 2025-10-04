-- Story 6.2: Telegram User Authentication & Registration
-- Create telegram_users table for storing Telegram user registration data

CREATE TABLE IF NOT EXISTS telegram_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  telegram_user_id BIGINT NOT NULL UNIQUE,
  telegram_username TEXT,
  telegram_first_name TEXT,
  telegram_last_name TEXT,
  chat_id BIGINT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_telegram_user_per_agent UNIQUE (agent_id, telegram_user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_telegram_users_agent_id ON telegram_users(agent_id);
CREATE INDEX idx_telegram_users_telegram_user_id ON telegram_users(telegram_user_id);
CREATE INDEX idx_telegram_users_chat_id ON telegram_users(chat_id);

-- Row Level Security (RLS) policies
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access to telegram_users"
  ON telegram_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Story 6.3: Message Forwarding
-- Create message_forwards table for tracking message forwarding

CREATE TABLE IF NOT EXISTS message_forwards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  source_platform TEXT NOT NULL CHECK (source_platform IN ('telegram', 'whatsapp')),
  source_chat_id TEXT NOT NULL,
  destination_platform TEXT NOT NULL CHECK (destination_platform IN ('telegram', 'whatsapp')),
  destination_identifier TEXT NOT NULL,
  message_content TEXT,
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'photo', 'document')),
  forward_status TEXT NOT NULL DEFAULT 'pending' CHECK (forward_status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  forwarded_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_platforms CHECK (source_platform != destination_platform)
);

-- Create index for faster lookups
CREATE INDEX idx_message_forwards_agent_id ON message_forwards(agent_id);
CREATE INDEX idx_message_forwards_status ON message_forwards(forward_status);
CREATE INDEX idx_message_forwards_source ON message_forwards(source_platform, source_chat_id);
CREATE INDEX idx_message_forwards_destination ON message_forwards(destination_platform, destination_identifier);

-- Row Level Security (RLS) policies
ALTER TABLE message_forwards ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access to message_forwards"
  ON message_forwards
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Story 6.4: Conversational Features
-- Add telegram_chat_id column to conversation_logs for Telegram integration

ALTER TABLE conversation_logs
ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT,
ADD COLUMN IF NOT EXISTS telegram_message_id INTEGER;

-- Create index for Telegram message lookups
CREATE INDEX IF NOT EXISTS idx_conversation_logs_telegram_chat ON conversation_logs(telegram_chat_id);
