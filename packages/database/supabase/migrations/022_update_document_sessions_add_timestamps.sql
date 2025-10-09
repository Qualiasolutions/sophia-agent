-- Add completion timestamps to document_request_sessions table
ALTER TABLE document_request_sessions
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS abandoned_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for performance queries
CREATE INDEX IF NOT EXISTS idx_document_sessions_completed_at ON document_request_sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_document_sessions_abandoned_at ON document_request_sessions(abandoned_at);
CREATE INDEX IF NOT EXISTS idx_document_sessions_status_updated ON document_request_sessions(status, updated_at);

-- Add comments
COMMENT ON COLUMN document_request_sessions.completed_at IS 'Timestamp when flow was completed successfully';
COMMENT ON COLUMN document_request_sessions.abandoned_at IS 'Timestamp when flow was abandoned or timed out';