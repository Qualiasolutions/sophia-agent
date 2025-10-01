-- Migration: Allow null agent_id for unregistered agent attempts
-- Description: Modify conversation_logs to track messages from unregistered phone numbers
-- Author: Dev Agent (James)
-- Date: 2025-10-01

-- Drop the NOT NULL constraint on agent_id to allow logging unregistered attempts
ALTER TABLE conversation_logs
  ALTER COLUMN agent_id DROP NOT NULL;

-- Add comment explaining when agent_id can be null
COMMENT ON COLUMN conversation_logs.agent_id IS 'Foreign key to agents table. NULL for unregistered agent attempts.';
