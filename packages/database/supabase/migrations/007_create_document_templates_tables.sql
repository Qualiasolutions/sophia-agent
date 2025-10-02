-- Migration: Create document_templates and document_generations tables
-- Description: Schema for document template management and generation tracking (Epic 2, Story 2.1)
-- Author: Master Orchestrator Agent
-- Date: 2025-10-03

-- Create document_templates table
CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  template_content TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT template_content_not_empty CHECK (LENGTH(TRIM(template_content)) > 0),
  CONSTRAINT template_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Create document_generations table for tracking generated documents
CREATE TABLE document_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES document_templates(id) ON DELETE RESTRICT,
  variables_provided JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_content TEXT NOT NULL,
  generation_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT generated_content_not_empty CHECK (LENGTH(TRIM(generated_content)) > 0)
);

-- Create indexes for performance optimization
CREATE INDEX idx_document_templates_name ON document_templates(name);
CREATE INDEX idx_document_templates_is_active ON document_templates(is_active);
CREATE INDEX idx_document_templates_category ON document_templates(category);
CREATE INDEX idx_document_generations_agent_id ON document_generations(agent_id);
CREATE INDEX idx_document_generations_template_id ON document_generations(template_id);
CREATE INDEX idx_document_generations_created_at ON document_generations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_generations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role can view all templates
CREATE POLICY "Service role can view all templates" ON document_templates
  FOR SELECT
  USING (true);

-- RLS Policy: Service role can insert templates
CREATE POLICY "Service role can insert templates" ON document_templates
  FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Service role can update templates
CREATE POLICY "Service role can update templates" ON document_templates
  FOR UPDATE
  USING (true);

-- RLS Policy: Service role can view all document generations
CREATE POLICY "Service role can view all generations" ON document_generations
  FOR SELECT
  USING (true);

-- RLS Policy: Service role can insert document generations (API operations)
CREATE POLICY "Service role can insert generations" ON document_generations
  FOR INSERT
  WITH CHECK (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_document_templates_updated_at
  BEFORE UPDATE ON document_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE document_templates IS 'Document templates with variable placeholders for conversational document generation';
COMMENT ON COLUMN document_templates.id IS 'Unique identifier for the template (UUID)';
COMMENT ON COLUMN document_templates.name IS 'Unique name of the template (e.g., "Marketing Form v2")';
COMMENT ON COLUMN document_templates.category IS 'Category for grouping templates (e.g., "marketing", "legal", "listing")';
COMMENT ON COLUMN document_templates.template_content IS 'Template content with variable placeholders (e.g., {{property_address}})';
COMMENT ON COLUMN document_templates.variables IS 'JSON array of variable definitions: [{"name": "property_address", "type": "text", "required": true}]';
COMMENT ON COLUMN document_templates.description IS 'Human-readable description of template purpose and usage';
COMMENT ON COLUMN document_templates.is_active IS 'Whether the template is active and available for use';

COMMENT ON TABLE document_generations IS 'Log of all document generations for analytics and audit trail';
COMMENT ON COLUMN document_generations.id IS 'Unique identifier for the generation (UUID)';
COMMENT ON COLUMN document_generations.agent_id IS 'Agent who generated the document (FK to agents)';
COMMENT ON COLUMN document_generations.template_id IS 'Template used for generation (FK to document_templates)';
COMMENT ON COLUMN document_generations.variables_provided IS 'JSON object of variable values provided by agent';
COMMENT ON COLUMN document_generations.generated_content IS 'Final generated document content';
COMMENT ON COLUMN document_generations.generation_time_ms IS 'Time taken to generate document in milliseconds';
COMMENT ON COLUMN document_generations.created_at IS 'Timestamp when document was generated';
