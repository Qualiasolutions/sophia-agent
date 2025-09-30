-- Migration: Create agents table with RLS policies
-- Description: Initial schema for agent profiles with phone number validation and Row Level Security
-- Author: Dev Agent (James)
-- Date: 2025-09-30

-- Enable UUID extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- E.164 phone number format validation (e.g., +35799123456)
  CONSTRAINT phone_number_e164 CHECK (phone_number ~ '^\+[1-9]\d{1,14}$')
);

-- Create indexes for performance optimization
CREATE INDEX idx_agents_phone_number ON agents(phone_number);
CREATE INDEX idx_agents_is_active ON agents(is_active);

-- Enable Row Level Security
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Agents can view their own data
-- Allows agents to SELECT their own record where their auth.uid() matches the agent id
CREATE POLICY "Agents can view own data" ON agents
  FOR SELECT
  USING (auth.uid()::text = id::text);

-- RLS Policy: Admins can view all agents
-- Allows admin users to SELECT all agent records
-- Note: Requires admin_users table to exist (will be created in future migration)
CREATE POLICY "Admins can view all agents" ON agents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()::text
        AND is_active = true
    )
  );

-- RLS Policy: Admins can insert agents
-- Allows admin/super_admin users to INSERT new agent records
CREATE POLICY "Admins can insert agents" ON agents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()::text
        AND role IN ('admin', 'super_admin')
        AND is_active = true
    )
  );

-- RLS Policy: Admins can update agents
-- Allows admin/super_admin users to UPDATE existing agent records
CREATE POLICY "Admins can update agents" ON agents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()::text
        AND role IN ('admin', 'super_admin')
        AND is_active = true
    )
  );

-- Comment on table and columns for documentation
COMMENT ON TABLE agents IS 'Agent profiles with phone number authentication';
COMMENT ON COLUMN agents.id IS 'Unique identifier for the agent (UUID)';
COMMENT ON COLUMN agents.phone_number IS 'Agent phone number in E.164 format (e.g., +35799123456)';
COMMENT ON COLUMN agents.name IS 'Full name of the agent';
COMMENT ON COLUMN agents.email IS 'Email address of the agent';
COMMENT ON COLUMN agents.is_active IS 'Whether the agent account is active';
COMMENT ON COLUMN agents.created_at IS 'Timestamp when the agent record was created';
COMMENT ON COLUMN agents.updated_at IS 'Timestamp when the agent record was last updated';
