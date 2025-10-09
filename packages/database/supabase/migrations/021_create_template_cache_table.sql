-- Migration: Create template_cache table for template caching service
-- Description: Creates template_cache table expected by TemplateCacheService
-- Author: Auto-generated fix
-- Date: 2025-10-09

-- Create template_cache table
CREATE TABLE template_cache (
  template_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT DEFAULT 'general',
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  required_fields JSONB DEFAULT '[]'::jsonb,
  optional_fields JSONB DEFAULT '[]'::jsonb,
  subject_line TEXT,
  instructions TEXT,
  estimated_tokens INTEGER DEFAULT 0,
  version TEXT DEFAULT '1.0.0',
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{
    "usage": 0,
    "averageResponseTime": 2000,
    "successRate": 0.95,
    "tags": [],
    "relatedTemplates": []
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT template_cache_content_not_empty CHECK (LENGTH(TRIM(content)) > 0),
  CONSTRAINT template_cache_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT template_cache_id_not_empty CHECK (LENGTH(TRIM(template_id)) > 0)
);

-- Create indexes for performance
CREATE INDEX idx_template_cache_category ON template_cache(category);
CREATE INDEX idx_template_cache_is_active ON template_cache(is_active);
CREATE INDEX idx_template_cache_template_id ON template_cache(template_id);
CREATE INDEX idx_template_cache_category_subcategory ON template_cache(category, subcategory);
CREATE INDEX idx_template_cache_metadata_usage ON template_cache USING GIN ((metadata->'usage'));

-- Enable Row Level Security
ALTER TABLE template_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role can view all templates" ON template_cache
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert templates" ON template_cache
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update templates" ON template_cache
  FOR UPDATE
  USING (true);

CREATE POLICY "Service role can delete templates" ON template_cache
  FOR DELETE
  USING (true);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_template_cache_updated_at
  BEFORE UPDATE ON template_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial registration templates that are referenced in the code
INSERT INTO template_cache (template_id, name, category, subcategory, content, variables, required_fields, subject_line, instructions) VALUES
(
  'seller_registration_standard',
  'Standard Seller Registration',
  'registration',
  'seller',
  'Dear [SELLER_NAME], (Seller)

This email is to provide you with a registration.

Client Information: [BUYER_NAMES]

Property Introduced: [PROPERTY_DESCRIPTION]

Viewing Arranged for: [VIEWING_DATETIME]

Please confirm Registration and Viewing.

For the confirmation, Could you please reply ''Yes I confirm''

Looking forward to your prompt confirmation.',
  '[{"name": "seller_name", "type": "text", "required": true}, {"name": "buyer_names", "type": "text", "required": true}, {"name": "property_description", "type": "text", "required": true}, {"name": "viewing_datetime", "type": "text", "required": true}]',
  '[{"name": "seller_name", "label": "Seller Name", "type": "text", "required": true}, {"name": "buyer_names", "label": "Buyer Names", "type": "text", "required": true}, {"name": "property_description", "label": "Property Description", "type": "text", "required": true}, {"name": "viewing_datetime", "label": "Viewing Date and Time", "type": "text", "required": true}]',
  'Registration Confirmation for Property Introduction',
  '1. Ask for seller name
2. Ask for buyer names
3. Ask for property description
4. Ask for viewing date and time
5. Generate the registration email
6. Send subject line in separate message'
),
(
  'email_good_client_request',
  'Good Client Request Email',
  'email',
  'client',
  'Dear [AGENT_NAME],

We have a good client interested in properties in [AREA].

Client details:
- Name: [CLIENT_NAME]
- Budget: [BUDGET]
- Requirements: [REQUIREMENTS]
- Contact: [CONTACT]

Please suggest suitable properties.

Best regards',
  '[{"name": "agent_name", "type": "text", "required": true}, {"name": "area", "type": "text", "required": true}, {"name": "client_name", "type": "text", "required": true}, {"name": "budget", "type": "text", "required": true}, {"name": "requirements", "type": "text", "required": true}, {"name": "contact", "type": "text", "required": true}]',
  '[{"name": "agent_name", "label": "Agent Name", "type": "text", "required": true}, {"name": "area", "label": "Area", "type": "text", "required": true}, {"name": "client_name", "label": "Client Name", "type": "text", "required": true}, {"name": "budget", "label": "Budget", "type": "text", "required": true}, {"name": "requirements", "label": "Requirements", "type": "text", "required": true}, {"name": "contact", "label": "Contact", "type": "text", "required": true}]',
  'Good Client Request - Property Search',
  '1. Collect agent name
2. Collect area of interest
3. Collect client details
4. Generate email to agent'
),
(
  'viewing_form_advanced',
  'Advanced Viewing Form',
  'viewing',
  'form',
  'VIEWING FORM

Property Details:
- Address: [PROPERTY_ADDRESS]
- Price: [PRICE]
- Type: [PROPERTY_TYPE]

Client Information:
- Name: [CLIENT_NAME]
- Phone: [CLIENT_PHONE]
- Email: [CLIENT_EMAIL]

Viewing Schedule:
- Date: [VIEWING_DATE]
- Time: [VIEWING_TIME]

Agent Notes:
[AGENT_NOTES]',
  '[{"name": "property_address", "type": "text", "required": true}, {"name": "price", "type": "text", "required": true}, {"name": "property_type", "type": "text", "required": true}, {"name": "client_name", "type": "text", "required": true}, {"name": "client_phone", "type": "text", "required": true}, {"name": "client_email", "type": "text", "required": true}, {"name": "viewing_date", "type": "text", "required": true}, {"name": "viewing_time", "type": "text", "required": true}, {"name": "agent_notes", "type": "text", "required": false}]',
  '[{"name": "property_address", "label": "Property Address", "type": "text", "required": true}, {"name": "price", "label": "Price", "type": "text", "required": true}, {"name": "property_type", "label": "Property Type", "type": "text", "required": true}, {"name": "client_name", "label": "Client Name", "type": "text", "required": true}, {"name": "client_phone", "label": "Client Phone", "type": "text", "required": true}, {"name": "client_email", "label": "Client Email", "type": "text", "required": true}, {"name": "viewing_date", "label": "Viewing Date", "type": "text", "required": true}, {"name": "viewing_time", "label": "Viewing Time", "type": "text", "required": true}, {"name": "agent_notes", "label": "Agent Notes", "type": "text", "required": false}]',
  'Viewing Form - [PROPERTY_ADDRESS]',
  '1. Collect property details
2. Collect client information
3. Schedule viewing
4. Add agent notes if needed'
),
(
  'agreement_marketing_email',
  'Marketing Agreement Email',
  'agreement',
  'marketing',
  'Dear [OWNER_NAME],

Further to our conversation, please find below the marketing agreement details:

Property Address: [PROPERTY_ADDRESS]
Marketing Period: [MARKETING_PERIOD]
Commission Rate: [COMMISSION_RATE]

Please confirm if you agree to proceed with the marketing agreement.

Best regards',
  '[{"name": "owner_name", "type": "text", "required": true}, {"name": "property_address", "type": "text", "required": true}, {"name": "marketing_period", "type": "text", "required": true}, {"name": "commission_rate", "type": "text", "required": true}]',
  '[{"name": "owner_name", "label": "Owner Name", "type": "text", "required": true}, {"name": "property_address", "label": "Property Address", "type": "text", "required": true}, {"name": "marketing_period", "label": "Marketing Period", "type": "text", "required": true}, {"name": "commission_rate", "label": "Commission Rate", "type": "text", "required": true}]',
  'Marketing Agreement for [PROPERTY_ADDRESS]',
  '1. Collect owner name
2. Collect property address
3. Define marketing period
4. Set commission rate
5. Generate agreement email'
);

-- Comments for documentation
COMMENT ON TABLE template_cache IS 'Template cache for the TemplateCacheService with performance metrics and caching support';
COMMENT ON COLUMN template_cache.template_id IS 'Unique template identifier (e.g., "seller_registration_standard")';
COMMENT ON COLUMN template_cache.name IS 'Human-readable template name';
COMMENT ON COLUMN template_cache.category IS 'Template category (email, registration, viewing, agreement, etc.)';
COMMENT ON COLUMN template_cache.subcategory IS 'Template subcategory for finer classification';
COMMENT ON COLUMN template_cache.content IS 'Template content with variable placeholders';
COMMENT ON COLUMN template_cache.variables IS 'JSON array of variable definitions used in template';
COMMENT ON COLUMN template_cache.required_fields IS 'JSON array of required fields for template generation';
COMMENT ON COLUMN template_cache.optional_fields IS 'JSON array of optional fields for template generation';
COMMENT ON COLUMN template_cache.subject_line IS 'Email subject line if applicable';
COMMENT ON COLUMN template_cache.instructions IS 'Instructions for template usage';
COMMENT ON COLUMN template_cache.estimated_tokens IS 'Estimated token count for the template';
COMMENT ON COLUMN template_cache.version IS 'Template version for tracking updates';
COMMENT ON COLUMN template_cache.is_active IS 'Whether the template is active and available';
COMMENT ON COLUMN template_cache.metadata IS 'JSON metadata including usage stats, performance metrics, tags, and related templates';