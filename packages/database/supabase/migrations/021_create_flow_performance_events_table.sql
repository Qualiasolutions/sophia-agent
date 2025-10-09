-- Create flow performance events table
CREATE TABLE IF NOT EXISTS flow_performance_events (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    session_id TEXT NOT NULL,
    flow_id TEXT NOT NULL,
    template_id TEXT NOT NULL,
    step_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('step_start', 'step_complete', 'flow_complete', 'flow_abandon')),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    time_spent BIGINT, -- Time spent on step in milliseconds
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_flow_performance_events_session_id ON flow_performance_events(session_id);
CREATE INDEX idx_flow_performance_events_flow_id ON flow_performance_events(flow_id);
CREATE INDEX idx_flow_performance_events_template_id ON flow_performance_events(template_id);
CREATE INDEX idx_flow_performance_events_timestamp ON flow_performance_events(timestamp);
CREATE INDEX idx_flow_performance_events_event_type ON flow_performance_events(event_type);

-- Add comments
COMMENT ON TABLE flow_performance_events IS 'Tracks flow performance metrics and user interactions';
COMMENT ON COLUMN flow_performance_events.session_id IS 'Document session identifier';
COMMENT ON COLUMN flow_performance_events.flow_id IS 'Flow identifier from template';
COMMENT ON COLUMN flow_performance_events.step_id IS 'Step identifier within flow';
COMMENT ON COLUMN flow_performance_events.event_type IS 'Type of event (step_start, step_complete, flow_complete, flow_abandon)';
COMMENT ON COLUMN flow_performance_events.time_spent IS 'Time spent on step in milliseconds';
COMMENT ON COLUMN flow_performance_events.metadata IS 'Additional event metadata';

-- Enable RLS
ALTER TABLE flow_performance_events ENABLE ROW LEVEL SECURITY;

-- Create policy for service access
CREATE POLICY "Allow service access to flow performance events"
    ON flow_performance_events
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);