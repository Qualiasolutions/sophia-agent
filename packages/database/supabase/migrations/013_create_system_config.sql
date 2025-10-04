-- Story 6.9: Configuration & Template Management
-- Create system_config table for dynamic system configuration

-- Create system_config table
CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL, -- Store as JSON string
  description TEXT,
  updated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_system_config_key ON system_config(key);

-- Enable RLS
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admin users can read all config
CREATE POLICY "Admin users can read system config"
  ON system_config
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Admin users can update config
CREATE POLICY "Admin users can update system config"
  ON system_config
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Service role can do everything
CREATE POLICY "Service role full access to system config"
  ON system_config
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Seed initial configuration
INSERT INTO system_config (key, value, description) VALUES
  ('openai_model', '"gpt-4-turbo"', 'OpenAI model to use for AI responses (gpt-4-turbo, gpt-4o, gpt-3.5-turbo)'),
  ('response_timeout_ms', '5000', 'Maximum time to wait for AI response in milliseconds'),
  ('rate_limit_per_second', '80', 'Maximum messages per second for WhatsApp'),
  ('max_conversation_history', '10', 'Number of messages to include in conversation context'),
  ('auto_archive_days', '30', 'Days before archiving old conversations'),
  ('whatsapp_webhook_url', '"https://sophia-agent-eoqa67bpy-qualiasolutionscy.vercel.app/api/whatsapp-webhook"', 'Twilio WhatsApp webhook URL'),
  ('telegram_webhook_url', '""', 'Telegram bot webhook URL (to be configured)')
ON CONFLICT (key) DO NOTHING;
