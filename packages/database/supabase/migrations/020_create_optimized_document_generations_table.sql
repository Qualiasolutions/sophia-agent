-- Create table for optimized document generation tracking
CREATE TABLE IF NOT EXISTS optimized_document_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  template_id TEXT NOT NULL,
  template_name TEXT NOT NULL,
  category TEXT NOT NULL,
  processing_time_ms INTEGER NOT NULL,
  tokens_used INTEGER NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  original_request TEXT NOT NULL,
  generated_content TEXT NOT NULL,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Performance tracking fields
  intent_classification_time_ms INTEGER,
  template_retrieval_time_ms INTEGER,
  instruction_generation_time_ms INTEGER,
  openai_processing_time_ms INTEGER,

  -- Template metadata
  required_fields TEXT[], -- JSON array of required field names
  optional_fields TEXT[], -- JSON array of optional field names
  suggestions TEXT[], -- JSON array of suggested follow-up questions

  -- Analytics fields
  optimization_score DECIMAL(3,2), -- Calculated efficiency score
  cost_estimate DECIMAL(10,6), -- Estimated cost in USD
  success BOOLEAN DEFAULT true,
  error_message TEXT
);

-- Indexes for performance
CREATE INDEX idx_optimized_doc_generations_agent_id ON optimized_document_generations(agent_id);
CREATE INDEX idx_optimized_doc_generations_template_id ON optimized_document_generations(template_id);
CREATE INDEX idx_optimized_doc_generations_created_at ON optimized_document_generations(created_at DESC);
CREATE INDEX idx_optimized_doc_generations_category ON optimized_document_generations(category);
CREATE INDEX idx_optimized_doc_generations_session_id ON optimized_document_generations(session_id);

-- Comments for documentation
COMMENT ON TABLE optimized_document_generations IS 'Tracks document generation requests using the optimized template system';
COMMENT ON COLUMN optimized_document_generations.processing_time_ms IS 'Total processing time in milliseconds';
COMMENT ON COLUMN optimized_document_generations.tokens_used IS 'Total tokens used for generation';
COMMENT ON COLUMN optimized_document_generations.confidence IS 'Intent classification confidence score (0-1)';
COMMENT ON COLUMN optimized_document_generations.optimization_score IS 'Efficiency score based on speed and resource usage';
COMMENT ON COLUMN optimized_document_generations.cost_estimate IS 'Estimated cost in USD based on token usage';