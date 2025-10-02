/**
 * Document Service
 * Handles document template management, validation, and rendering
 * Epic 2: Document Generation System (Stories 2.2, 2.3)
 */

import type {
  TemplateVariable,
  TemplateValidationResult,
  TemplateRenderOptions,
  TemplateRenderResult,
} from '@sophiaai/shared';

/**
 * Extract variable placeholders from template content
 * Matches patterns like {{variable_name}}
 */
export function extractTemplateVariables(templateContent: string): string[] {
  const variablePattern = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
  const matches = templateContent.matchAll(variablePattern);
  const variables = new Set<string>();

  for (const match of matches) {
    if (match[1]) {
      variables.add(match[1]);
    }
  }

  return Array.from(variables);
}

/**
 * Auto-generate variable schema from template content
 * Creates basic variable definitions with inferred types
 */
export function generateVariableSchema(templateContent: string): TemplateVariable[] {
  const variableNames = extractTemplateVariables(templateContent);

  return variableNames.map((name) => {
    // Infer type from variable name patterns
    let type: TemplateVariable['type'] = 'text';

    if (name.includes('price') || name.includes('amount') || name.includes('sqm') ||
        name.includes('bedrooms') || name.includes('bathrooms') || name.includes('year')) {
      type = 'number';
    } else if (name.includes('email')) {
      type = 'email';
    } else if (name.includes('phone') || name.includes('mobile')) {
      type = 'phone';
    } else if (name.includes('date')) {
      type = 'date';
    }

    // Generate human-readable label
    const label = name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return {
      name,
      type,
      required: true,
      label,
    };
  });
}

/**
 * Validate provided variable values against template requirements
 */
export function validateTemplateVariables(
  variables: TemplateVariable[],
  providedValues: Record<string, any>
): TemplateValidationResult {
  const result: TemplateValidationResult = {
    valid: true,
    missingVariables: [],
    invalidVariables: [],
    errors: [],
  };

  for (const variable of variables) {
    const value = providedValues[variable.name];

    // Check required variables
    if (variable.required && (value === undefined || value === null || value === '')) {
      result.valid = false;
      result.missingVariables.push(variable.name);
      result.errors.push(`Missing required variable: ${variable.label || variable.name}`);
      continue;
    }

    // Skip validation if optional and not provided
    if (!variable.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type validation
    switch (variable.type) {
      case 'number':
        if (typeof value !== 'number' && isNaN(Number(value))) {
          result.valid = false;
          result.invalidVariables.push({
            name: variable.name,
            reason: `Expected a number, got: ${typeof value}`,
          });
        } else {
          const numValue = typeof value === 'number' ? value : Number(value);
          if (variable.validation?.min !== undefined && numValue < variable.validation.min) {
            result.valid = false;
            result.invalidVariables.push({
              name: variable.name,
              reason: `Value ${numValue} is less than minimum ${variable.validation.min}`,
            });
          }
          if (variable.validation?.max !== undefined && numValue > variable.validation.max) {
            result.valid = false;
            result.invalidVariables.push({
              name: variable.name,
              reason: `Value ${numValue} is greater than maximum ${variable.validation.max}`,
            });
          }
        }
        break;

      case 'email':
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(String(value))) {
          result.valid = false;
          result.invalidVariables.push({
            name: variable.name,
            reason: 'Invalid email format',
          });
        }
        break;

      case 'phone':
        // Basic international phone validation
        const phonePattern = /^\+?[1-9]\d{7,14}$/;
        const cleanedPhone = String(value).replace(/[\s\-\(\)]/g, '');
        if (!phonePattern.test(cleanedPhone)) {
          result.valid = false;
          result.invalidVariables.push({
            name: variable.name,
            reason: 'Invalid phone number format',
          });
        }
        break;

      case 'date':
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          result.valid = false;
          result.invalidVariables.push({
            name: variable.name,
            reason: 'Invalid date format',
          });
        }
        break;
    }

    // Pattern validation
    if (variable.validation?.pattern && typeof value === 'string') {
      const pattern = new RegExp(variable.validation.pattern);
      if (!pattern.test(value)) {
        result.valid = false;
        result.invalidVariables.push({
          name: variable.name,
          reason: `Value does not match required pattern`,
        });
      }
    }

    // Options validation
    if (variable.validation?.options && !variable.validation.options.includes(String(value))) {
      result.valid = false;
      result.invalidVariables.push({
        name: variable.name,
        reason: `Value must be one of: ${variable.validation.options.join(', ')}`,
      });
    }
  }

  return result;
}

/**
 * Format value based on variable type
 */
function formatValue(value: any, type: TemplateVariable['type']): string {
  if (value === undefined || value === null) {
    return '';
  }

  switch (type) {
    case 'number':
      return Number(value).toLocaleString();
    case 'date':
      return new Date(value).toLocaleDateString('en-GB');
    case 'boolean':
      return value ? 'Yes' : 'No';
    default:
      return String(value);
  }
}

/**
 * Render document template with provided variable values
 * Supports basic conditional sections: {{#if variable}}...{{/if}}
 */
export function renderTemplate(
  templateContent: string,
  variables: TemplateVariable[],
  providedValues: Record<string, any>,
  options: TemplateRenderOptions = {}
): TemplateRenderResult {
  const startTime = Date.now();

  try {
    let content = templateContent;

    // Apply default values for missing optional variables
    const values = { ...providedValues };
    for (const variable of variables) {
      if (values[variable.name] === undefined && variable.defaultValue !== undefined) {
        values[variable.name] = variable.defaultValue;
      }
    }

    // Process conditional sections if enabled
    if (options.conditionalSections !== false) {
      // Match {{#if variable}}content{{/if}}
      const conditionalPattern = /\{\{#if\s+([a-zA-Z_][a-zA-Z0-9_]*)\}\}([\s\S]*?)\{\{\/if\}\}/g;
      content = content.replace(conditionalPattern, (_match, varName, innerContent) => {
        const value = values[varName];
        // Include content if variable is truthy
        return value ? innerContent : '';
      });
    }

    // Replace variable placeholders with values
    const variablePattern = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
    content = content.replace(variablePattern, (_match, varName) => {
      const variable = variables.find(v => v.name === varName);
      const value = values[varName];

      if (value === undefined || value === null) {
        return ''; // Empty string for missing values
      }

      return variable ? formatValue(value, variable.type) : String(value);
    });

    // Normalize whitespace if not preserving
    if (!options.preserveWhitespace) {
      content = content
        .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
        .trim();
    }

    const renderTime = Date.now() - startTime;

    return {
      success: true,
      content,
      warnings: renderTime > 200 ? [`Rendering took ${renderTime}ms`] : undefined,
    };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown rendering error'],
    };
  }
}

/**
 * Parse currency values from natural language
 * Examples: "500k", "€500,000", "300K EUR"
 */
export function parseCurrency(input: string): number | null {
  const cleaned = input.replace(/[€$£,\s]/g, '');

  // Handle k/K for thousands
  if (/k$/i.test(cleaned)) {
    const value = parseFloat(cleaned.replace(/k$/i, ''));
    return isNaN(value) ? null : value * 1000;
  }

  // Handle m/M for millions
  if (/m$/i.test(cleaned)) {
    const value = parseFloat(cleaned.replace(/m$/i, ''));
    return isNaN(value) ? null : value * 1000000;
  }

  const value = parseFloat(cleaned);
  return isNaN(value) ? null : value;
}

/**
 * Parse percentage values from natural language
 * Examples: "4%", "4", "0.04"
 */
export function parsePercentage(input: string): number | null {
  const cleaned = input.replace(/[%\s]/g, '');
  const value = parseFloat(cleaned);

  if (isNaN(value)) {
    return null;
  }

  // If value is < 1, assume it's already decimal (0.04)
  // Otherwise assume it's percentage (4 = 4%)
  return value < 1 ? value : value / 100;
}
