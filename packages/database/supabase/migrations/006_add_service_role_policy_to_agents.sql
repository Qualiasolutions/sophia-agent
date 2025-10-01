-- Migration: Add service role policy to agents table
-- Description: Allow service_role to bypass RLS for API operations
-- Author: Dev Agent (James)
-- Date: 2025-10-01
--
-- Issue: Webhook fails to lookup agents because service_role has no RLS policy
-- Fix: Add policy allowing service_role full access to agents table

-- RLS Policy: Service role has full access to agents table
-- This allows the backend API (using service_role_key) to lookup agents by phone number
CREATE POLICY "Service role has full access" ON agents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comment for documentation
COMMENT ON TABLE agents IS 'Agent profiles with RLS enabled. Service role has full access for API operations.';
