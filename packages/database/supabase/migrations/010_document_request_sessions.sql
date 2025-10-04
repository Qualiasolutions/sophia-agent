-- Migration 010: Document Request Sessions
-- Track multi-turn document generation conversations
-- Enables "continue my document" functionality and ensures complete data collection

CREATE TABLE IF NOT EXISTS document_request_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  document_template_id TEXT NOT NULL, -- Template ID from document_templates.ts
  collected_fields JSONB NOT NULL DEFAULT '{}',
  missing_fields TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'collecting' CHECK (status IN ('collecting', 'validating', 'complete', 'generating', 'sent')),
  last_prompt TEXT, -- Last user message/prompt
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_document_request_sessions_agent_id ON document_request_sessions(agent_id);
CREATE INDEX idx_document_request_sessions_template_id ON document_request_sessions(document_template_id);
CREATE INDEX idx_document_request_sessions_status ON document_request_sessions(status);
CREATE INDEX idx_document_request_sessions_updated_at ON document_request_sessions(updated_at DESC);

-- Composite index for finding active sessions by agent and template
CREATE INDEX idx_document_request_sessions_active ON document_request_sessions(agent_id, status, updated_at DESC)
WHERE status IN ('collecting', 'validating');

-- RLS Policies (Service role has full access, matching other tables in the system)
ALTER TABLE document_request_sessions ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY document_request_sessions_service_all ON document_request_sessions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add comment
COMMENT ON TABLE document_request_sessions IS 'Tracks multi-turn conversations for document generation. Stores partial data, missing fields, and session status.';
COMMENT ON COLUMN document_request_sessions.document_template_id IS 'Template ID from document_templates.ts enum (e.g., "reg_banks_property", "email_good_client_request")';
COMMENT ON COLUMN document_request_sessions.collected_fields IS 'JSONB object with field_name: field_value pairs collected so far';
COMMENT ON COLUMN document_request_sessions.missing_fields IS 'Array of field names still required to complete the document';
COMMENT ON COLUMN document_request_sessions.status IS 'collecting: gathering fields | validating: checking completeness | complete: ready | generating: calling Assistant | sent: delivered';
