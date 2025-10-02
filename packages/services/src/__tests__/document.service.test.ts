/**
 * Document Service Tests
 * Epic 2: Document Generation System (Stories 2.2, 2.3)
 */

import { describe, it, expect } from 'vitest';
import {
  extractTemplateVariables,
  generateVariableSchema,
  validateTemplateVariables,
  renderTemplate,
  parseCurrency,
  parsePercentage,
} from '../document.service';
import type { TemplateVariable } from '@/shared/types';

describe('extractTemplateVariables', () => {
  it('should extract variable placeholders from template', () => {
    const template = 'Property: {{property_name}} at {{address}} for {{price}}';
    const variables = extractTemplateVariables(template);

    expect(variables).toEqual(['property_name', 'address', 'price']);
  });

  it('should handle templates with no variables', () => {
    const template = 'This is a static template with no variables';
    const variables = extractTemplateVariables(template);

    expect(variables).toEqual([]);
  });

  it('should deduplicate repeated variables', () => {
    const template = '{{name}} is {{name}} with {{email}}';
    const variables = extractTemplateVariables(template);

    expect(variables).toEqual(['name', 'email']);
  });

  it('should handle multiline templates', () => {
    const template = `
      Property: {{property_name}}
      Location: {{location}}
      Price: {{price}}
    `;
    const variables = extractTemplateVariables(template);

    expect(variables).toEqual(['property_name', 'location', 'price']);
  });
});

describe('generateVariableSchema', () => {
  it('should generate schema with inferred types', () => {
    const template = 'Property {{property_name}} costs {{price}} with {{bedrooms}} bedrooms. Contact: {{email}}';
    const schema = generateVariableSchema(template);

    expect(schema).toHaveLength(4);
    expect(schema.find(v => v.name === 'property_name')?.type).toBe('text');
    expect(schema.find(v => v.name === 'price')?.type).toBe('number');
    expect(schema.find(v => v.name === 'bedrooms')?.type).toBe('number');
    expect(schema.find(v => v.name === 'email')?.type).toBe('email');
  });

  it('should generate human-readable labels', () => {
    const template = '{{property_name}} at {{square_footage}}';
    const schema = generateVariableSchema(template);

    expect(schema.find(v => v.name === 'property_name')?.label).toBe('Property Name');
    expect(schema.find(v => v.name === 'square_footage')?.label).toBe('Square Footage');
  });
});

describe('validateTemplateVariables', () => {
  const variables: TemplateVariable[] = [
    { name: 'name', type: 'text', required: true },
    { name: 'price', type: 'number', required: true, validation: { min: 0, max: 1000000 } },
    { name: 'email', type: 'email', required: false },
    { name: 'phone', type: 'phone', required: false },
  ];

  it('should pass validation with all required fields', () => {
    const values = { name: 'Villa', price: 500000 };
    const result = validateTemplateVariables(variables, values);

    expect(result.valid).toBe(true);
    expect(result.missingVariables).toHaveLength(0);
    expect(result.invalidVariables).toHaveLength(0);
  });

  it('should fail validation for missing required fields', () => {
    const values = { name: 'Villa' };
    const result = validateTemplateVariables(variables, values);

    expect(result.valid).toBe(false);
    expect(result.missingVariables).toContain('price');
  });

  it('should validate number ranges', () => {
    const values = { name: 'Villa', price: 2000000 };
    const result = validateTemplateVariables(variables, values);

    expect(result.valid).toBe(false);
    expect(result.invalidVariables.some(v => v.name === 'price')).toBe(true);
  });

  it('should validate email format', () => {
    const values = { name: 'Villa', price: 500000, email: 'invalid-email' };
    const result = validateTemplateVariables(variables, values);

    expect(result.valid).toBe(false);
    expect(result.invalidVariables.some(v => v.name === 'email')).toBe(true);
  });

  it('should validate phone format', () => {
    const validValues = { name: 'Villa', price: 500000, phone: '+35799123456' };
    const invalidValues = { name: 'Villa', price: 500000, phone: 'abc123' };

    expect(validateTemplateVariables(variables, validValues).valid).toBe(true);
    expect(validateTemplateVariables(variables, invalidValues).valid).toBe(false);
  });

  it('should allow optional fields to be missing', () => {
    const values = { name: 'Villa', price: 500000 };
    const result = validateTemplateVariables(variables, values);

    expect(result.valid).toBe(true);
  });
});

describe('renderTemplate', () => {
  const variables: TemplateVariable[] = [
    { name: 'property_name', type: 'text', required: true },
    { name: 'price', type: 'number', required: true },
    { name: 'bedrooms', type: 'number', required: true },
    { name: 'optional_feature', type: 'text', required: false, defaultValue: 'Standard' },
  ];

  it('should render template with all variables', () => {
    const template = 'Property: {{property_name}}\nPrice: €{{price}}\nBedrooms: {{bedrooms}}';
    const values = { property_name: 'Luxury Villa', price: 500000, bedrooms: 3 };

    const result = renderTemplate(template, variables, values);

    expect(result.success).toBe(true);
    expect(result.content).toContain('Property: Luxury Villa');
    expect(result.content).toContain('Price: €500,000');
    expect(result.content).toContain('Bedrooms: 3');
  });

  it('should apply default values for optional variables', () => {
    const template = 'Feature: {{optional_feature}}';
    const values = { property_name: 'Villa', price: 500000, bedrooms: 3 };

    const result = renderTemplate(template, variables, values);

    expect(result.success).toBe(true);
    expect(result.content).toContain('Feature: Standard');
  });

  it('should handle conditional sections', () => {
    const template = 'Property: {{property_name}}{{#if sea_view}}\nSea View Available{{/if}}';
    const variablesWithCondition: TemplateVariable[] = [
      ...variables,
      { name: 'sea_view', type: 'boolean', required: false },
    ];

    const withSeaView = renderTemplate(
      template,
      variablesWithCondition,
      { property_name: 'Villa', price: 500000, bedrooms: 3, sea_view: true }
    );

    const withoutSeaView = renderTemplate(
      template,
      variablesWithCondition,
      { property_name: 'Villa', price: 500000, bedrooms: 3, sea_view: false }
    );

    expect(withSeaView.content).toContain('Sea View Available');
    expect(withoutSeaView.content).not.toContain('Sea View Available');
  });

  it('should replace missing values with empty string', () => {
    const template = 'Name: {{property_name}}, Extra: {{missing_var}}';
    const values = { property_name: 'Villa', price: 500000, bedrooms: 3 };

    const result = renderTemplate(template, variables, values);

    expect(result.success).toBe(true);
    expect(result.content).toContain('Name: Villa, Extra:');
  });

  it('should normalize whitespace', () => {
    const template = 'Line 1\n\n\n\nLine 2\n\n\nLine 3';
    const values = { property_name: 'Villa', price: 500000, bedrooms: 3 };

    const result = renderTemplate(template, variables, values);

    expect(result.success).toBe(true);
    expect(result.content).not.toContain('\n\n\n');
  });
});

describe('parseCurrency', () => {
  it('should parse currency with k suffix', () => {
    expect(parseCurrency('500k')).toBe(500000);
    expect(parseCurrency('300K')).toBe(300000);
  });

  it('should parse currency with m suffix', () => {
    expect(parseCurrency('1.5m')).toBe(1500000);
    expect(parseCurrency('2M')).toBe(2000000);
  });

  it('should parse formatted currency', () => {
    expect(parseCurrency('€500,000')).toBe(500000);
    expect(parseCurrency('$300,000')).toBe(300000);
    expect(parseCurrency('£ 1,500,000')).toBe(1500000);
  });

  it('should parse plain numbers', () => {
    expect(parseCurrency('500000')).toBe(500000);
    expect(parseCurrency('300000')).toBe(300000);
  });

  it('should return null for invalid input', () => {
    expect(parseCurrency('abc')).toBeNull();
    expect(parseCurrency('')).toBeNull();
  });
});

describe('parsePercentage', () => {
  it('should parse percentage with % symbol', () => {
    expect(parsePercentage('4%')).toBe(0.04);
    expect(parsePercentage('10.5%')).toBe(0.105);
  });

  it('should parse plain numbers as percentages', () => {
    expect(parsePercentage('4')).toBe(0.04);
    expect(parsePercentage('10.5')).toBe(0.105);
  });

  it('should handle decimal percentages', () => {
    expect(parsePercentage('0.04')).toBe(0.04);
    expect(parsePercentage('0.5')).toBe(0.5);
  });

  it('should return null for invalid input', () => {
    expect(parsePercentage('abc')).toBeNull();
    expect(parsePercentage('')).toBeNull();
  });
});
