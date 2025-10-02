/**
 * Document Template Types
 * Epic 2: Document Generation System
 */

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'email' | 'phone';
  required: boolean;
  label?: string;
  description?: string;
  defaultValue?: string | number | boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}

export interface DocumentTemplate {
  id: string;
  name: string;
  category: string;
  template_content: string;
  variables: TemplateVariable[];
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentGeneration {
  id: string;
  agent_id: string;
  template_id: string;
  variables_provided: Record<string, any>;
  generated_content: string;
  generation_time_ms?: number;
  created_at: string;
}

export interface TemplateValidationResult {
  valid: boolean;
  missingVariables: string[];
  invalidVariables: { name: string; reason: string }[];
  errors: string[];
}

export interface TemplateRenderOptions {
  escapeHtml?: boolean;
  preserveWhitespace?: boolean;
  conditionalSections?: boolean;
}

export interface TemplateRenderResult {
  success: boolean;
  content?: string;
  errors?: string[];
  warnings?: string[];
}
