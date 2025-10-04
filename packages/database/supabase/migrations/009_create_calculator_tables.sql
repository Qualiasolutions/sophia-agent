-- Migration: Create Calculator Tables
-- Epic 3, Story 3.1: Calculator Configuration & Database Schema
-- Created: 2025-10-04

-- ================================================================
-- Table: calculators
-- Purpose: Store calculator tool configurations (URLs, input fields, descriptions)
-- ================================================================

CREATE TABLE calculators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  tool_url TEXT NOT NULL,
  description TEXT NOT NULL,
  input_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ================================================================
-- Table: calculator_history
-- Purpose: Track calculation requests and results for analytics
-- ================================================================

CREATE TABLE calculator_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  calculator_id UUID REFERENCES calculators(id) ON DELETE CASCADE NOT NULL,
  inputs_provided JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ================================================================
-- Indexes for Performance
-- ================================================================

CREATE INDEX idx_calculators_name ON calculators(name);
CREATE INDEX idx_calculators_is_active ON calculators(is_active);
CREATE INDEX idx_calculator_history_agent_id ON calculator_history(agent_id);
CREATE INDEX idx_calculator_history_calculator_id ON calculator_history(calculator_id);
CREATE INDEX idx_calculator_history_created_at ON calculator_history(created_at DESC);

-- ================================================================
-- RLS (Row Level Security) Policies
-- ================================================================

-- Enable RLS
ALTER TABLE calculators ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculator_history ENABLE ROW LEVEL SECURITY;

-- Calculators: Anyone can read active calculators
CREATE POLICY "Anyone can view active calculators"
  ON calculators FOR SELECT
  USING (is_active = true);

-- Calculators: Service role can manage all calculators
CREATE POLICY "Service role can manage calculators"
  ON calculators FOR ALL
  USING (auth.role() = 'service_role');

-- Calculator History: Agents can view their own history
CREATE POLICY "Agents can view their own calculation history"
  ON calculator_history FOR SELECT
  USING (agent_id = auth.uid());

-- Calculator History: Service role can insert and manage all records
CREATE POLICY "Service role can insert calculation history"
  ON calculator_history FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all calculation history"
  ON calculator_history FOR ALL
  USING (auth.role() = 'service_role');

-- ================================================================
-- Updated At Trigger Function
-- ================================================================

CREATE OR REPLACE FUNCTION update_calculators_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculators_updated_at
  BEFORE UPDATE ON calculators
  FOR EACH ROW
  EXECUTE FUNCTION update_calculators_updated_at();

-- ================================================================
-- Seed Data: 3 Calculator Tools
-- ================================================================

INSERT INTO calculators (name, tool_url, description, input_fields, is_active) VALUES

-- 1. Transfer Fees Calculator
(
  'transfer_fees',
  'https://www.zyprus.com/help/1260/property-transfer-fees-calculator',
  'Calculate property transfer fees in Cyprus based on property value',
  '[
    {
      "name": "property_value",
      "label": "Property Value (€)",
      "type": "currency",
      "required": true,
      "validation": {
        "min": 0,
        "max": 100000000
      }
    }
  ]'::jsonb,
  true
),

-- 2. Capital Gains Tax Calculator
(
  'capital_gains_tax',
  'https://www.zyprus.com/capital-gains-calculator',
  'Calculate capital gains tax on property sales in Cyprus',
  '[
    {
      "name": "purchase_price",
      "label": "Original Purchase Price (€)",
      "type": "currency",
      "required": true,
      "validation": {
        "min": 0,
        "max": 100000000
      }
    },
    {
      "name": "sale_price",
      "label": "Sale Price (€)",
      "type": "currency",
      "required": true,
      "validation": {
        "min": 0,
        "max": 100000000
      }
    },
    {
      "name": "purchase_year",
      "label": "Year of Purchase",
      "type": "number",
      "required": true,
      "validation": {
        "min": 1960,
        "max": 2025
      }
    },
    {
      "name": "sale_year",
      "label": "Year of Sale",
      "type": "number",
      "required": true,
      "validation": {
        "min": 1960,
        "max": 2025
      }
    }
  ]'::jsonb,
  true
),

-- 3. VAT Calculator (Houses/Apartments Only)
(
  'vat_calculator',
  'https://www.mof.gov.cy/mof/tax/taxdep.nsf/vathousecalc_gr/vathousecalc_gr?openform',
  'Calculate VAT for houses and apartments in Cyprus (not for land or commercial properties)',
  '[
    {
      "name": "property_value",
      "label": "Property Value (€)",
      "type": "currency",
      "required": true,
      "validation": {
        "min": 0,
        "max": 100000000
      }
    },
    {
      "name": "property_type",
      "label": "Property Type",
      "type": "select",
      "required": true,
      "options": ["house", "apartment"],
      "validation": {
        "allowed_values": ["house", "apartment"]
      }
    }
  ]'::jsonb,
  true
);

-- ================================================================
-- Verification Query (for testing)
-- ================================================================

-- SELECT name, tool_url, description, input_fields FROM calculators WHERE is_active = true;
