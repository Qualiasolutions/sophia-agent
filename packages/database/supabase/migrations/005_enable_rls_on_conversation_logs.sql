-- Migration: Enable RLS on conversation_logs table
-- Description: Add Row Level Security policies to conversation_logs for data protection
-- Author: Dev Agent (James)
-- Date: 2025-10-01

-- Enable Row Level Security on conversation_logs
ALTER TABLE conversation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role has full access (for API operations)
-- This allows the backend API (using service_role_key) to read/write all logs
CREATE POLICY "Service role has full access" ON conversation_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policy: Agents can view their own conversation logs
-- Allows authenticated agents to SELECT their own conversation history
-- Note: (select auth.uid()) prevents re-evaluation for each row (performance optimization)
CREATE POLICY "Agents can view own logs" ON conversation_logs
  FOR SELECT
  TO authenticated
  USING ((select auth.uid())::text = agent_id::text);

-- Note: Admin policy will be added in future migration when admin_users table is created

-- Comment on table for documentation
COMMENT ON TABLE conversation_logs IS 'Conversation logs with RLS enabled. Service role has full access for API operations, agents can view own logs.';
