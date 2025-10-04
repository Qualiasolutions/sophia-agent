/**
 * Calculator Types
 * Epic 3: Real Estate Calculators
 */

/**
 * Calculator Input Field Configuration
 * Defines the structure and validation rules for calculator input fields
 */
export interface CalculatorInputField {
  name: string;
  label: string;
  type: 'currency' | 'number' | 'text' | 'select' | 'date';
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    allowed_values?: string[];
  };
}

/**
 * Calculator Configuration
 * Database representation of a calculator tool
 */
export interface Calculator {
  id: string;
  name: string;
  tool_url: string;
  description: string;
  input_fields: CalculatorInputField[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Calculator History Record
 * Tracks calculation requests and results for analytics
 */
export interface CalculatorHistory {
  id: string;
  agent_id: string | null;
  calculator_id: string;
  inputs_provided: Record<string, any>;
  result_summary: string | null;
  created_at: string;
}

/**
 * Calculator Input Validation Result
 */
export interface CalculatorInputValidationResult {
  valid: boolean;
  missingFields: string[];
  invalidFields: {
    name: string;
    value: any;
    reason: string;
  }[];
  errors: string[];
}

/**
 * Calculator Execution Request
 */
export interface CalculatorExecutionRequest {
  calculator_name: string;
  inputs: Record<string, any>;
  agent_id?: string;
}

/**
 * Calculator Execution Result
 */
export interface CalculatorExecutionResult {
  success: boolean;
  calculator_name: string;
  inputs: Record<string, any>;
  result?: {
    summary: string;
    details?: Record<string, any>;
    formatted_output?: string;
  };
  error?: {
    code: string;
    message: string;
    fallback_url?: string;
  };
  execution_time_ms?: number;
}

/**
 * Calculator Discovery/Help Response
 */
export interface CalculatorListItem {
  name: string;
  description: string;
  example_usage: string;
  required_inputs: string[];
}

/**
 * Calculator Conversation State
 * Tracked in conversation context for multi-turn calculator requests
 */
export interface CalculatorConversationState {
  calculator_name: string;
  collected_inputs: Record<string, any>;
  remaining_inputs: string[];
  status: 'collecting' | 'ready' | 'executing' | 'completed' | 'failed';
  last_prompt?: string;
}

/**
 * Currency parsing options
 */
export interface CurrencyParseOptions {
  default_currency?: 'EUR' | 'USD' | 'GBP';
  allow_negative?: boolean;
}

/**
 * Percentage parsing options
 */
export interface PercentageParseOptions {
  as_decimal?: boolean; // If true, returns 0.04 for "4%", otherwise returns 4
  allow_negative?: boolean;
}
