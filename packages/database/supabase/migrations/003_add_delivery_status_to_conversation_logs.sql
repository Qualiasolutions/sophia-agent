-- Migration: Add delivery_status column to conversation_logs table
-- Description: Track message delivery status (queued, sent, delivered, read, failed)
-- Author: Dev Agent (James)
-- Date: 2025-10-01

ALTER TABLE conversation_logs
ADD COLUMN delivery_status TEXT CHECK (
  delivery_status IN ('queued', 'sent', 'delivered', 'read', 'failed', 'undelivered')
);

-- Create index for delivery_status for performance optimization
CREATE INDEX idx_conversation_logs_delivery_status ON conversation_logs(delivery_status);

-- Comment on column for documentation
COMMENT ON COLUMN conversation_logs.delivery_status IS 'Message delivery status from Twilio/WhatsApp webhooks: queued, sent, delivered, read, failed, undelivered';
