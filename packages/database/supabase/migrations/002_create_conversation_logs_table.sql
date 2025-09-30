-- Migration: Create conversation_logs table for WhatsApp message logging
-- Description: Store inbound/outbound messages for agent conversations
-- Author: Dev Agent (James)
-- Date: 2025-09-30

CREATE TABLE conversation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  message_id TEXT,  -- WhatsApp/Twilio message ID for deduplication

  -- Ensure message IDs are unique to prevent duplicate logging on webhook retries
  CONSTRAINT unique_message_id UNIQUE (message_id)
);

-- Create indexes for performance optimization
CREATE INDEX idx_conversation_logs_agent_id ON conversation_logs(agent_id);
CREATE INDEX idx_conversation_logs_timestamp ON conversation_logs(timestamp);
CREATE INDEX idx_conversation_logs_direction ON conversation_logs(direction);

-- Comment on table and columns for documentation
COMMENT ON TABLE conversation_logs IS 'Stores all inbound and outbound WhatsApp messages for agents';
COMMENT ON COLUMN conversation_logs.id IS 'Unique identifier for the message log entry';
COMMENT ON COLUMN conversation_logs.agent_id IS 'Foreign key to agents table';
COMMENT ON COLUMN conversation_logs.message_text IS 'The actual message content';
COMMENT ON COLUMN conversation_logs.direction IS 'Message direction: inbound (agent to system) or outbound (system to agent)';
COMMENT ON COLUMN conversation_logs.timestamp IS 'When the message was sent/received';
COMMENT ON COLUMN conversation_logs.message_id IS 'External message ID from WhatsApp/Twilio for deduplication';
