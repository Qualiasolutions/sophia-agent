# Epic 3: Real Estate Calculators

**Epic Goal:** Provide agents with instant access to real estate calculations through conversational WhatsApp interface by integrating Sophia with 3 existing calculator tools/links. Sophia will recognize calculator requests, guide agents to provide necessary inputs, access the external calculator tools, and deliver formatted results via WhatsApp. This epic eliminates the need for agents to manually navigate calculator websites, enabling faster client responses and improved productivity.

**NOTE:** Sophia will use 3 existing calculator links/tools provided by zyprus.com rather than implementing calculation logic from scratch.

## Story 3.1: Calculator Configuration & Database Schema

As a **developer**,
I want **database schema to store calculator tool URLs and calculation history**,
so that **calculator configurations are centralized and usage can be tracked for analytics**.

### Acceptance Criteria

1. `calculators` table created with schema: `id` (UUID), `name` (text, unique), `tool_url` (text), `description` (text), `input_fields` (jsonb array), `is_active` (boolean), `created_at` (timestamp), `updated_at` (timestamp)
2. Input fields define what information agents need to provide: `[{"name": "loan_amount", "label": "Loan Amount (€)", "required": true}]`
3. `calculator_history` table created with schema: `id` (UUID), `agent_id` (UUID FK), `calculator_id` (UUID FK), `inputs_provided` (jsonb), `result_summary` (text), `created_at` (timestamp)
4. Database indexes on: `calculators.name`, `calculators.is_active`, `calculator_history.agent_id`
5. RLS policies applied to both tables
6. Migration scripts committed for reproducible schema
7. 3 calculator tools seeded in database with URLs, descriptions, and required input fields

## Story 3.2: Web Scraping/Tool Integration for External Calculators

As a **developer**,
I want **ability to programmatically interact with external calculator tools**,
so that **Sophia can retrieve calculation results without manual agent interaction**.

### Acceptance Criteria

1. Tool integration function accepts calculator URL and input parameters
2. Function uses appropriate method to interact with calculator (web scraping, API if available, or browser automation)
3. Results extracted and parsed into structured format
4. Timeout handling (max 10 seconds per calculation request)
5. Error handling for: tool unavailable, invalid inputs, parsing failures
6. Retry logic implemented (max 2 retries on failure)
7. Successfully retrieves results from all 3 calculator tools with test inputs
8. Integration method documented for each calculator tool (technical approach, parsing logic, edge cases)

## Story 3.3: Conversational Calculator Request Flow

As a **developer**,
I want **AI conversation flow that recognizes calculator requests and collects required inputs**,
so that **agents can request calculations naturally via WhatsApp**.

### Acceptance Criteria

1. OpenAI prompt enhanced to recognize calculator requests (e.g., "calculate mortgage for 300k", "what's my commission on 450k sale")
2. System responds with list of available calculators when agent asks: "what calculators do you have?"
3. When agent requests calculation, AI identifies required inputs from calculator configuration
4. AI asks clarifying questions for missing inputs in conversational manner
5. Agent responses parsed and mapped to calculator input fields (natural language → structured data)
6. Conversation state in Redis tracks: selected calculator, collected inputs, remaining inputs needed
7. Agent can provide multiple inputs in single message (e.g., "mortgage for 300k at 4% for 30 years")
8. AI confirms all collected inputs before accessing calculator tool

## Story 3.4: Calculator Tool Execution & Result Delivery

As an **agent**,
I want **to request a calculation via WhatsApp and receive formatted results**,
so that **I can quickly access calculation results without visiting calculator websites manually**.

### Acceptance Criteria

1. Agent initiates calculator request: "sophia calculate mortgage for 300,000 at 4% for 30 years"
2. Sophia identifies calculator tool, collects all required inputs via conversation
3. Sophia confirms inputs and indicates calculation in progress: "Calculating... ⏳"
4. System accesses external calculator tool with provided inputs
5. Result extracted from tool and formatted for WhatsApp delivery
6. Result delivered to agent with clear formatting: "💰 Mortgage Calculator Result\n\nInputs:\nLoan: €300,000\nRate: 4.0%\nTerm: 30 years\n\n📊 Monthly Payment: €1,432\nTotal Interest: €215,609"
7. Calculation logged to `calculator_history` table
8. End-to-end flow completes within 15-20 seconds
9. If tool fails, Sophia provides calculator URL: "I'm unable to calculate right now. You can use this calculator directly: [URL]"

## Story 3.5: Calculator Help & Discovery System

As an **agent**,
I want **to ask Sophia about available calculators and how to use them**,
so that **I can discover calculator features without external documentation**.

### Acceptance Criteria

1. Agent can request calculator list: "what calculators do you have?", "show available calculators"
2. Sophia responds with formatted list of 3 calculators with brief descriptions
3. Agent can request calculator-specific help: "how do I use the mortgage calculator?"
4. Help response includes: required inputs, example usage
5. Calculator names support fuzzy matching (e.g., "mortage" → "mortgage calculator")
6. Help dynamically generated from `calculators` table configuration
7. List includes emoji icons for visual clarity (💰, 📈, 💵, etc.)

## Story 3.6: Calculator Result History & Retrieval

As an **agent**,
I want **to retrieve recent calculations I've performed**,
so that **I can reference previous results without recalculating**.

### Acceptance Criteria

1. Agent can request calculation history: "show my recent calculations"
2. System retrieves last 5-10 calculations from `calculator_history` for requesting agent
3. Results displayed with timestamp and calculator type: "Yesterday 3:45 PM - Mortgage: €300k → €1,432/month"
4. Agent can request specific calculation by recency: "show me the last mortgage calculation"
5. History includes full input details and result summary
6. Results formatted for WhatsApp readability
7. Privacy ensured: agents only see their own calculation history (RLS enforcement)
8. History retrieval completes in <500ms

## Story 3.7: Calculator Input Validation & Error Handling

As a **developer**,
I want **input validation and error handling for calculator requests**,
so that **Sophia provides helpful guidance when agents provide invalid values**.

### Acceptance Criteria

1. Input validation rejects: negative values (where inappropriate), non-numeric inputs for number fields
2. Currency parsing handles variations: "300k", "€300,000", "300000", "300K EUR"
3. Percentage parsing handles: "4%", "4", "0.04" → normalized format
4. Clear error messages guide agents: "Please provide a valid interest rate (e.g., 4.5%)"
5. Tool access failures handled gracefully with fallback to providing tool URL
6. Timeout errors explained: "The calculator is taking too long. Here's the direct link: [URL]"
7. All errors logged for troubleshooting
8. Agent can retry with corrected inputs
