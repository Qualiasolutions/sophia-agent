-- Create OpenAI usage stats table
CREATE TABLE IF NOT EXISTS openai_usage_stats (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    prompt_hash TEXT NOT NULL,
    model TEXT NOT NULL,
    tokens_used INTEGER NOT NULL,
    response_time BIGINT NOT NULL, -- in milliseconds
    cached BOOLEAN NOT NULL DEFAULT FALSE,
    context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_openai_usage_stats_created_at ON openai_usage_stats(created_at);
CREATE INDEX idx_openai_usage_stats_model ON openai_usage_stats(model);
CREATE INDEX idx_openai_usage_stats_cached ON openai_usage_stats(cached);
CREATE INDEX idx_openai_usage_stats_hash ON openai_usage_stats(prompt_hash);

-- Add comments
COMMENT ON TABLE openai_usage_stats IS 'Tracks OpenAI API usage for optimization and cost analysis';
COMMENT ON COLUMN openai_usage_stats.prompt_hash IS 'Hash of the prompt for caching and deduplication';
COMMENT ON COLUMN openai_usage_stats.tokens_used IS 'Number of tokens used in the request';
COMMENT ON COLUMN openai_usage_stats.response_time IS 'Response time in milliseconds';
COMMENT ON COLUMN openai_usage_stats.cached IS 'Whether the response was served from cache';

-- Enable RLS
ALTER TABLE openai_usage_stats ENABLE ROW LEVEL SECURITY;

-- Create policy for service access
CREATE POLICY "Allow service access to OpenAI usage stats"
    ON openai_usage_stats
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);