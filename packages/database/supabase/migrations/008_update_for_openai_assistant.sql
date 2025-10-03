-- Migration: Update database for OpenAI Assistant integration
-- Description: Remove document_templates table and update document_generations for Assistant tracking
-- Author: Claude Code
-- Date: 2025-10-03

-- Drop document_templates table (not needed - Assistant has files)
DROP TABLE IF EXISTS document_templates CASCADE;

-- Update document_generations table for OpenAI Assistant tracking
ALTER TABLE document_generations
  DROP CONSTRAINT IF EXISTS document_generations_template_id_fkey,
  DROP COLUMN IF EXISTS template_id,
  ADD COLUMN IF NOT EXISTS template_filename TEXT,
  ADD COLUMN IF NOT EXISTS thread_id TEXT,
  ADD COLUMN IF NOT EXISTS assistant_id TEXT,
  ADD COLUMN IF NOT EXISTS run_id TEXT;

-- Add indexes for Assistant tracking
CREATE INDEX IF NOT EXISTS idx_document_generations_thread_id ON document_generations(thread_id);
CREATE INDEX IF NOT EXISTS idx_document_generations_assistant_id ON document_generations(assistant_id);
CREATE INDEX IF NOT EXISTS idx_document_generations_run_id ON document_generations(run_id);

-- Update column comments
COMMENT ON COLUMN document_generations.thread_id IS 'OpenAI Assistant thread ID for conversation tracking';
COMMENT ON COLUMN document_generations.assistant_id IS 'OpenAI Assistant ID used for generation';
COMMENT ON COLUMN document_generations.run_id IS 'OpenAI Assistant run ID for this generation';
COMMENT ON COLUMN document_generations.template_filename IS 'Filename of template used from Knowledge Base (e.g., Reg_Banks.docx)';

-- Update table comment
COMMENT ON TABLE document_generations IS 'Log of all document generations using OpenAI Assistant with Knowledge Base templates';
