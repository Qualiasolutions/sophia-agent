# 9. Database Schema

## 9.1 Schema Overview

**Database**: PostgreSQL 15+
**Total Tables**: 14
**Row-Level Security**: Enabled on all tables
**Migrations**: Managed via Supabase CLI

## 9.2 Complete SQL Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT phone_number_e164 CHECK (phone_number ~ '^\+[1-9]\d{1,14}$')
);

CREATE INDEX idx_agents_phone_number ON agents(phone_number);
CREATE INDEX idx_agents_is_active ON agents(is_active);

-- 2. Admin users table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'viewer')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('whatsapp', 'telegram')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  current_intent TEXT CHECK (current_intent IN ('GENERATE_DOCUMENT', 'UPLOAD_LISTING', 'CALCULATE', 'SEND_EMAIL', 'UNKNOWN'))
);

CREATE INDEX idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX idx_conversations_is_active ON conversations(is_active);

-- 4. Conversation messages table
CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('agent', 'sophia')),
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX idx_conversation_messages_timestamp ON conversation_messages(timestamp);

-- 5. Document templates table
CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('contracts', 'marketing', 'legal', 'financial')),
  description TEXT,
  template_content TEXT NOT NULL,
  required_fields JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_document_templates_category ON document_templates(category);
CREATE INDEX idx_document_templates_is_active ON document_templates(is_active);

-- 6. Document generations table
CREATE TABLE document_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES document_templates(id) ON DELETE CASCADE,
  template_data JSONB NOT NULL,
  generated_file_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  error_message TEXT,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_document_generations_agent_id ON document_generations(agent_id);
CREATE INDEX idx_document_generations_status ON document_generations(status);

-- 7. Listing drafts table
CREATE TABLE listing_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  property_type TEXT NOT NULL CHECK (property_type IN ('apartment', 'villa', 'office', 'land')),
  location TEXT,
  bedrooms INTEGER,
  bathrooms INTEGER,
  area NUMERIC,
  price NUMERIC,
  description TEXT,
  photo_urls JSONB DEFAULT '[]',
  status TEXT NOT NULL CHECK (status IN ('draft', 'ready', 'uploaded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listing_drafts_agent_id ON listing_drafts(agent_id);
CREATE INDEX idx_listing_drafts_status ON listing_drafts(status);

-- 8. Listing uploads table
CREATE TABLE listing_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_draft_id UUID NOT NULL REFERENCES listing_drafts(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  external_listing_id TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT
);

CREATE INDEX idx_listing_uploads_listing_draft_id ON listing_uploads(listing_draft_id);
CREATE INDEX idx_listing_uploads_agent_id ON listing_uploads(agent_id);

-- 9. Listing upload attempts table
CREATE TABLE listing_upload_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listing_uploads(id) ON DELETE CASCADE,
  attempt_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  error_message TEXT,
  api_response JSONB,
  attempt_number INTEGER NOT NULL
);

-- 10. Calculators table
CREATE TABLE calculators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  formula TEXT NOT NULL,
  input_fields JSONB NOT NULL,
  output_format TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_calculators_is_active ON calculators(is_active);

-- 11. Calculator history table
CREATE TABLE calculator_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  calculator_id UUID NOT NULL REFERENCES calculators(id) ON DELETE CASCADE,
  inputs JSONB NOT NULL,
  result NUMERIC NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_calculator_history_agent_id ON calculator_history(agent_id);
CREATE INDEX idx_calculator_history_calculator_id ON calculator_history(calculator_id);

-- 12. Email templates table
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_template TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('follow_up', 'listing_promotion', 'contract_reminder', 'other')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_email_templates_is_active ON email_templates(is_active);

-- 13. Email logs table
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_logs_agent_id ON email_logs(agent_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_scheduled_for ON email_logs(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- 14. Email forwards table
CREATE TABLE email_forwards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  from_address TEXT NOT NULL,
  forward_to_address TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_forwards_agent_id ON email_forwards(agent_id);
CREATE INDEX idx_email_forwards_is_active ON email_forwards(is_active);

-- Row-Level Security Policies

-- Agents can view their own data
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own data" ON agents
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can view all agents" ON agents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()::text AND is_active = true)
  );

CREATE POLICY "Admins can insert agents" ON agents
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()::text AND role IN ('admin', 'super_admin') AND is_active = true)
  );

CREATE POLICY "Admins can update agents" ON agents
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()::text AND role IN ('admin', 'super_admin') AND is_active = true)
  );

-- Similar RLS policies for other tables...
-- (See complete policies in migration files)
```

---
