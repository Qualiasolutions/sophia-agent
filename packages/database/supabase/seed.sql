-- Seed script: Insert test agent data
-- Description: Create 2 test agent records for development and testing
-- Author: Dev Agent (James)
-- Date: 2025-09-30

-- Insert test agent 1
INSERT INTO agents (phone_number, name, email, is_active)
VALUES (
  '+35799123456',
  'Test Agent One',
  'agent1@sophiaai.com',
  true
);

-- Insert test agent 2
INSERT INTO agents (phone_number, name, email, is_active)
VALUES (
  '+35799654321',
  'Test Agent Two',
  'agent2@sophiaai.com',
  true
);
