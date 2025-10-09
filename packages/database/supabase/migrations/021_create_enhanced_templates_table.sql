-- Create enhanced_templates table for structured template storage
-- Supports sophisticated template features like flows, metadata, and analytics

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enhanced templates table
CREATE TABLE IF NOT EXISTS enhanced_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '2.0.0',

  -- Categorization
  category TEXT NOT NULL CHECK (category IN ('registration', 'email', 'viewing', 'agreement', 'social')),
  subcategory TEXT,

  -- Metadata (JSONB for flexible structure)
  metadata JSONB DEFAULT '{}',
  -- Example: {"priority": 9, "estimatedTokens": 150, "complexity": "medium", "confidence": 0.95}

  -- Triggers for intent classification
  triggers JSONB DEFAULT '{}',
  -- Example: {"keywords": ["registration"], "phrases": ["i need a registration"], "patterns": ["\\b(registration)\\b"]}

  -- Flow definition for multi-step templates
  flow JSONB,
  -- Example: {"steps": [{"id": "category", "type": "question", "content": "..."}]}

  -- Field definitions
  fields JSONB DEFAULT '{}',
  -- Example: {"required": [{"name": "seller_name", "type": "text"}], "optional": [...]}

  -- Content structure
  content JSONB DEFAULT '{}',
  -- Example: {"subject": "...", "body": "...", "variables": [...], "formatting": {...}}

  -- Instructions for AI
  instructions JSONB DEFAULT '{}',
  -- Example: {"systemPrompt": "...", "examples": [...], "constraints": [...]}

  -- Analytics data
  analytics JSONB DEFAULT '{}',
  -- Example: {"usageCount": 100, "successRate": 0.98, "lastUsed": "2025-01-09"}

  -- Vector embedding for semantic search
  embedding vector(1536),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT enhanced_templates_template_id_check CHECK (length(template_id) > 0),
  CONSTRAINT enhanced_templates_name_check CHECK (length(name) > 0),
  CONSTRAINT enhanced_templates_version_check CHECK (version ~ '^\d+\.\d+\.\d+$')
);

-- Create indexes for performance
CREATE INDEX idx_enhanced_templates_category ON enhanced_templates(category);
CREATE INDEX idx_enhanced_templates_subcategory ON enhanced_templates(subcategory);
CREATE INDEX idx_enhanced_templates_template_id ON enhanced_templates(template_id);
CREATE INDEX idx_enhanced_templates_priority ON enhanced_templates USING GIN ((metadata->'priority'));
CREATE INDEX idx_enhanced_templates_metadata ON enhanced_templates USING GIN (metadata);
CREATE INDEX idx_enhanced_templates_triggers ON enhanced_templates USING GIN (triggers);

-- Create HNSW index for vector similarity search
CREATE INDEX idx_enhanced_templates_embedding ON enhanced_templates
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_enhanced_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
CREATE TRIGGER enhanced_templates_updated_at_trigger
  BEFORE UPDATE ON enhanced_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_enhanced_templates_updated_at();

-- Function for semantic template matching
CREATE OR REPLACE FUNCTION match_template_intent(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.8,
  max_results int DEFAULT 5
)
RETURNS TABLE (
  template_id TEXT,
  name TEXT,
  category TEXT,
  similarity float,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.template_id,
    t.name,
    t.category,
    1 - (t.embedding <=> query_embedding) as similarity,
    t.metadata
  FROM enhanced_templates t
  WHERE 1 - (t.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Function to get templates by category and priority
CREATE OR REPLACE FUNCTION get_templates_by_category(
  p_category TEXT,
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  template_id TEXT,
  name TEXT,
  metadata JSONB,
  priority int
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.template_id,
    t.name,
    t.metadata,
    COALESCE((t.metadata->>'priority')::int, 5) as priority
  FROM enhanced_templates t
  WHERE t.category = p_category
  ORDER BY priority DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to update template analytics
CREATE OR REPLACE FUNCTION update_template_analytics(
  p_template_id TEXT,
  p_usage_count_increment int DEFAULT 1,
  p_success boolean DEFAULT true,
  p_response_time float DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  current_analytics JSONB;
BEGIN
  -- Get current analytics
  SELECT analytics INTO current_analytics
  FROM enhanced_templates
  WHERE template_id = p_template_id;

  -- Update analytics
  current_analytics := jsonb_set(
    current_analytics,
    '{usageCount}',
    COALESCE((current_analytics->>'usageCount')::int, 0) + p_usage_count_increment
  );

  current_analytics := jsonb_set(
    current_analytics,
    '{lastUsed}',
    to_jsonb(NOW())
  );

  -- Update success rate if success parameter is provided
  IF p_success IS NOT NULL THEN
    DECLARE
      total_usage int;
      successful_usage int;
    BEGIN
      total_usage := (current_analytics->>'usageCount')::int;
      successful_usage := COALESCE((current_analytics->>'successCount')::int, 0);

      IF p_success THEN
        successful_usage := successful_usage + 1;
      END IF;

      current_analytics := jsonb_set(
        current_analytics,
        '{successCount}',
        to_jsonb(successful_usage)
      );

      current_analytics := jsonb_set(
        current_analytics,
        '{successRate}',
        to_jsonb(successful_usage::float / total_usage)
      );
    END;
  END IF;

  -- Update average response time if provided
  IF p_response_time IS NOT NULL THEN
    DECLARE
      avg_time float;
      count int;
    BEGIN
      avg_time := COALESCE((current_analytics->>'averageResponseTime')::float, 0);
      count := (current_analytics->>'usageCount')::int;

      avg_time := (avg_time * (count - 1) + p_response_time) / count;

      current_analytics := jsonb_set(
        current_analytics,
        '{averageResponseTime}',
        to_jsonb(avg_time)
      );
    END;
  END IF;

  -- Save updated analytics
  UPDATE enhanced_templates
  SET analytics = current_analytics
  WHERE template_id = p_template_id;
END;
$$ LANGUAGE plpgsql;

-- Create template_migration_log table
CREATE TABLE IF NOT EXISTS template_migration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  message TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_template_migration_log_batch_id ON template_migration_log(batch_id);
CREATE INDEX idx_template_migration_log_status ON template_migration_log(status);

-- Row Level Security (RLS)
ALTER TABLE enhanced_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_migration_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for now since this is backend service)
CREATE POLICY "Enable all operations for authenticated users" ON enhanced_templates
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON template_migration_log
  FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions to service role
GRANT ALL ON enhanced_templates TO service_role;
GRANT ALL ON template_migration_log TO service_role;
GRANT EXECUTE ON FUNCTION match_template_intent TO service_role;
GRANT EXECUTE ON FUNCTION get_templates_by_category TO service_role;
GRANT EXECUTE ON FUNCTION update_template_analytics TO service_role;

-- Add comment
COMMENT ON TABLE enhanced_templates IS 'Enhanced template storage with structured data, flows, and analytics support';
COMMENT ON COLUMN enhanced_templates.embedding IS 'Vector embedding for semantic similarity search using OpenAI embeddings';
COMMENT ON COLUMN enhanced_templates.metadata IS 'Template metadata including priority, complexity, and performance metrics';
COMMENT ON COLUMN enhanced_templates.triggers IS 'Trigger patterns for intent classification';
COMMENT ON COLUMN enhanced_templates.flow IS 'Multi-step flow definition for interactive templates';
COMMENT ON COLUMN enhanced_templates.fields IS 'Field definitions including validation and formatting rules';
COMMENT ON COLUMN enhanced_templates.content IS 'Template content with variables and formatting instructions';
COMMENT ON COLUMN enhanced_templates.instructions IS 'AI generation instructions and constraints';
COMMENT ON COLUMN enhanced_templates.analytics IS 'Usage analytics and performance metrics';