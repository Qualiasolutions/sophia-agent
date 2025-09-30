# Epic 2: Document Generation System

**Epic Goal:** Enable agents to request pre-filled documents conversationally via WhatsApp by building a document template management system, implementing conversational document request workflows, and delivering generated documents as formatted WhatsApp messages. This epic delivers one of the three core productivity features identified in the Project Brief, allowing agents to generate marketing materials, listing sheets, and contract templates on-the-go without manual form filling.

## Story 2.1: Document Template Database Schema

As a **developer**,
I want **database schema for storing document templates with variable placeholders**,
so that **we can manage reusable templates and populate them with agent-provided data**.

### Acceptance Criteria

1. `document_templates` table created with schema: `id` (UUID), `name` (text, unique), `category` (text), `template_content` (text), `variables` (jsonb array), `description` (text), `is_active` (boolean), `created_at` (timestamp), `updated_at` (timestamp)
2. Variables stored as JSON array with format: `[{"name": "property_address", "type": "text", "required": true}]`
3. `document_generations` table created to log all generated documents with schema: `id` (UUID), `agent_id` (UUID FK), `template_id` (UUID FK), `variables_provided` (jsonb), `generated_content` (text), `created_at` (timestamp)
4. Database indexes created on frequently queried fields: `document_templates.name`, `document_templates.is_active`, `document_generations.agent_id`
5. RLS policies applied to both tables
6. Migration scripts committed for reproducible schema
7. At least 3 sample templates inserted: "Marketing Form v2", "Property Listing Sheet", "Agent Introduction Letter"

## Story 2.2: Template Variable Extraction & Validation

As a **developer**,
I want **utility functions to extract template variables and validate provided values**,
so that **the system can identify required inputs and ensure data completeness before generation**.

### Acceptance Criteria

1. Template parser function extracts variable placeholders from template content (e.g., `{{property_address}}`, `{{price}}`)
2. Variable validation function checks: required fields present, data types correct (text, number, date, etc.)
3. Missing variable detection returns list of unfulfilled variables with human-readable names
4. Variable schema auto-generated from template content if not manually defined
5. Unit tests cover: valid templates, templates with missing variables, invalid variable types
6. Function handles edge cases: empty templates, malformed placeholders, duplicate variable names
7. Validation completes in <100ms for templates with up to 50 variables

## Story 2.3: Document Template Rendering Engine

As a **developer**,
I want **document rendering function that populates templates with provided variable values**,
so that **we can generate final documents with agent-specific data**.

### Acceptance Criteria

1. Template rendering function accepts: template content (string), variables (object with key-value pairs)
2. All variable placeholders replaced with provided values (e.g., `{{property_address}}` → "123 Main St, Limassol")
3. Formatting preserved: line breaks, bullet points, numbered lists rendered correctly in WhatsApp text format
4. Conditional sections supported (e.g., "if price > 500000, include luxury disclaimer")
5. Default values applied for optional variables when not provided
6. Rendering handles special characters and UTF-8 encoding (Greek characters if needed in future)
7. Unit tests validate: complete rendering, partial rendering with defaults, conditional logic
8. Rendering completes in <200ms for documents up to 5000 characters

## Story 2.4: Conversational Document Request Flow

As a **developer**,
I want **AI conversation flow that recognizes document requests and collects required variables**,
so that **agents can request documents naturally without structured commands**.

### Acceptance Criteria

1. OpenAI prompt enhanced with document request intent recognition (e.g., "I need a marketing form", "generate listing sheet for 123 Main St")
2. System responds with list of available document templates when agent asks "what documents can you create?"
3. When agent requests specific document, AI identifies required variables from template schema
4. AI asks clarifying questions for each missing variable in conversational manner (e.g., "What's the property address?")
5. Agent responses parsed and mapped to template variables (natural language → structured data)
6. Conversation state in Redis tracks: selected template, collected variables, remaining variables
7. Agent can provide multiple variables in single message (e.g., "address is 123 Main St, price is 500k")
8. AI confirms all collected variables before generating document ("I have address: 123 Main St, price: €500,000. Should I generate the document?")

## Story 2.5: Document Generation & Delivery via WhatsApp

As an **agent**,
I want **to request a document via WhatsApp conversation and receive the generated document as formatted text**,
so that **I can instantly access pre-filled documents without manual form completion**.

### Acceptance Criteria

1. Agent initiates document request: "sophia i want a marketing form v2"
2. Sophia identifies "Marketing Form v2" template and lists required variables
3. Agent provides variable values through conversational exchange (multi-turn conversation)
4. Sophia confirms collected variables and asks for generation approval
5. System renders document using template + variables, logs to `document_generations` table
6. Generated document delivered to agent as WhatsApp message (formatted text, max 4096 characters per message, split if longer)
7. Document includes header: "📄 Marketing Form v2 - Generated [timestamp]" for clarity
8. Agent can request regeneration with corrections ("change price to 450k")
9. End-to-end flow completes within 30 seconds for documents with 5-10 variables

## Story 2.6: Document Template Management API

As a **developer**,
I want **API endpoints to create, read, update, and list document templates**,
so that **templates can be managed programmatically without direct database access**.

### Acceptance Criteria

1. POST `/api/admin/templates` - Create new template with validation
2. GET `/api/admin/templates` - List all templates with pagination, filtering by category
3. GET `/api/admin/templates/:id` - Retrieve single template by ID
4. PUT `/api/admin/templates/:id` - Update template content, variables, or metadata
5. DELETE `/api/admin/templates/:id` - Soft delete template (set `is_active=false`)
6. All endpoints require authentication (admin-level access, future story will implement auth)
7. Input validation ensures: template name unique, variables schema valid, content not empty
8. API returns proper HTTP status codes (200, 201, 400, 404, 500) with descriptive error messages

## Story 2.7: Common Document Templates Implementation

As a **product owner**,
I want **5-10 most frequently used document templates pre-loaded in the system**,
so that **agents can immediately use Sophia for document generation without setup**.

**NOTE:** Document templates are already prepared with instructions inside for Sophia on how to handle them.

### Acceptance Criteria

1. Existing document templates loaded into system (templates already created with complete content and instructions for Sophia)
2. At least 5 templates imported with realistic content and variable placeholders:
   - Marketing Form v2
   - Property Listing Sheet
   - Agent Introduction Letter
   - Viewing Appointment Confirmation
   - Price Reduction Notice
3. Each template includes: descriptive name, category tag, clear variable definitions with examples
4. Templates tested end-to-end: request → variable collection → generation → delivery
5. Template content reviewed by at least 1 real agent for accuracy and usefulness
6. Templates stored in Supabase via migration script for reproducibility
7. Documentation created listing available templates, required variables, and example usage

## Story 2.8: Document Generation Analytics & Logging

As a **product owner**,
I want **analytics on document generation usage patterns**,
so that **we can understand which templates are most valuable and optimize accordingly**.

### Acceptance Criteria

1. All document generations logged to `document_generations` table with: agent, template, timestamp, variables used
2. Query endpoint `/api/admin/analytics/documents` returns: total generations, generations by template, generations by agent, generations over time (daily/weekly)
3. Most popular templates identified (top 5 by generation count)
4. Average generation time tracked per template
5. Failed generations logged with error reasons (missing variables, rendering errors, etc.)
6. Analytics accessible via API for future admin dashboard visualization
7. Data retention policy defined (keep logs for 90 days, archive or delete older records)
8. Query performance optimized with database indexes, returns results in <500ms
