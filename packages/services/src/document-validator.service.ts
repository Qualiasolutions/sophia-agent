/**
 * Document Validator Service
 *
 * Handles validation and transformation of document fields
 * - Phone number masking
 * - Bank name extraction
 * - URL validation
 * - Required field validation
 * - Conditional logic evaluation
 */

import {
  DocumentTemplate,
  DocumentField,
  getDocumentTemplate,
  getMissingFields,
} from '@sophiaai/shared';

export class DocumentValidatorService {
  /**
   * Mask phone number for privacy
   * Example: 99 07 67 32 → 99 ** 67 32
   * Example: +357 99 07 67 32 → +357 99 ** 67 32
   * Example: +44 79 07 83 24 71 → +44 79 ** 83 24 71
   */
  static maskPhoneNumber(phone: string): string {
    if (!phone) return phone;

    // Remove extra spaces and normalize
    const normalized = phone.trim().replace(/\s+/g, ' ');

    // Pattern: Extract country code (optional), then groups of digits
    // We want to mask the second group (after first group/country code)

    // Try to parse phone number parts
    const parts = normalized.split(' ');

    if (parts.length >= 3) {
      // Has multiple parts (likely country code + phone segments)

      // Common patterns:
      // +357 99 07 67 32 → mask "07" (index 2)
      // 99 07 67 32 → mask "07" (index 1)
      // +44 79 07 83 24 71 → mask "07" (index 2)

      // Strategy: Mask the part after the first numeric group
      // Check if first part is country code (starts with + or is 2-3 digits)
      const hasCountryCode = parts[0].startsWith('+');

      // The second numeric part (after country code if present, otherwise second part)
      const maskIndex = hasCountryCode ? 2 : 1; // Index of part to mask

      if (parts.length > maskIndex && parts[maskIndex].length >= 2) {
        parts[maskIndex] = '**';
        return parts.join(' ');
      }
    }

    // Fallback for unsupported formats: return as-is
    return phone;
  }

  /**
   * Extract bank name from property URL
   * Example: https://www.remuproperties.com/... → "Remu Team"
   * Example: https://gordian.com/... → "Gordian Team"
   */
  static extractBankNameFromURL(url: string): string | null {
    if (!url) return null;

    const bankMappings: Record<string, string> = {
      remuproperties: 'Remu Team',
      remu: 'Remu Team',
      gordian: 'Gordian Team',
      altia: 'Altia Team',
      altamira: 'Altamira Team',
      astrea: 'Astrea Team',
      debtsale: 'Debt Sale Team',
    };

    const urlLower = url.toLowerCase();

    for (const [key, value] of Object.entries(bankMappings)) {
      if (urlLower.includes(key)) {
        return value;
      }
    }

    return null;
  }

  /**
   * Validate all fields for a document template
   */
  static validateFields(
    templateId: string,
    fields: Record<string, any>
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const template = getDocumentTemplate(templateId);
    if (!template) {
      return {
        valid: false,
        errors: [`Unknown template: ${templateId}`],
        warnings: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    const missingFields = getMissingFields(templateId, fields);
    if (missingFields.length > 0) {
      missingFields.forEach((fieldName) => {
        const field = template.fields.find((f) => f.name === fieldName);
        errors.push(
          `Missing required field: ${field?.label || fieldName} (${field?.description || 'no description'})`
        );
      });
    }

    // Validate individual field constraints
    template.fields.forEach((fieldDef) => {
      const value = fields[fieldDef.name];

      // Skip validation if field is empty and not required
      if (!value && !fieldDef.required) return;

      // Validate based on field type
      if (fieldDef.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`Invalid email format for ${fieldDef.label}`);
        }
      }

      if (fieldDef.type === 'url' && value) {
        try {
          new URL(value);
        } catch {
          errors.push(`Invalid URL format for ${fieldDef.label}`);
        }
      }

      if (fieldDef.type === 'phone' && value) {
        // Basic phone validation - should have at least 8 digits
        const digits = value.replace(/\D/g, '');
        if (digits.length < 8) {
          errors.push(
            `Invalid phone number for ${fieldDef.label} (too few digits)`
          );
        }
      }

      // Validate custom patterns
      if (fieldDef.validation?.pattern && value) {
        const regex = new RegExp(fieldDef.validation.pattern);
        if (!regex.test(value)) {
          errors.push(`Invalid format for ${fieldDef.label}`);
        }
      }

      // Check min/max length
      if (fieldDef.validation?.minLength && value?.length < fieldDef.validation.minLength) {
        errors.push(
          `${fieldDef.label} must be at least ${fieldDef.validation.minLength} characters`
        );
      }

      if (fieldDef.validation?.maxLength && value?.length > fieldDef.validation.maxLength) {
        warnings.push(
          `${fieldDef.label} exceeds recommended length of ${fieldDef.validation.maxLength} characters`
        );
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Process fields with automatic transformations
   * - Mask phone numbers
   * - Extract bank names
   * - Apply other automatic enhancements
   */
  static processFields(
    templateId: string,
    fields: Record<string, any>
  ): Record<string, any> {
    const template = getDocumentTemplate(templateId);
    if (!template) return fields;

    const processed = { ...fields };

    // Process each field
    template.fields.forEach((fieldDef) => {
      const value = processed[fieldDef.name];
      if (!value) return;

      // Apply phone masking
      if (fieldDef.validation?.customValidator === 'maskPhoneNumber') {
        processed[fieldDef.name] = this.maskPhoneNumber(value);
      }
    });

    // Special processing for bank registrations
    if (
      templateId.startsWith('reg_banks') &&
      processed.property_link &&
      !processed.bank_name
    ) {
      const extractedBank = this.extractBankNameFromURL(
        processed.property_link
      );
      if (extractedBank) {
        processed.bank_name = extractedBank;
      }
    }

    return processed;
  }

  /**
   * Check if conditional field should be shown
   */
  static shouldShowField(
    fieldDef: DocumentField,
    collectedFields: Record<string, any>
  ): boolean {
    if (!fieldDef.conditional) return true;

    const dependentValue = collectedFields[fieldDef.conditional.dependsOn];
    let conditionMet = false;

    switch (fieldDef.conditional.condition) {
      case 'equals':
        conditionMet = dependentValue === fieldDef.conditional.value;
        break;
      case 'notEquals':
        conditionMet = dependentValue !== fieldDef.conditional.value;
        break;
      case 'contains':
        conditionMet =
          typeof dependentValue === 'string' &&
          dependentValue.includes(fieldDef.conditional.value);
        break;
      case 'exists':
        conditionMet = !!dependentValue;
        break;
    }

    return fieldDef.conditional.showWhen ? conditionMet : !conditionMet;
  }

  /**
   * Get user-friendly prompt for missing field
   */
  static getFieldPrompt(
    templateId: string,
    fieldName: string
  ): string | null {
    const template = getDocumentTemplate(templateId);
    if (!template) return null;

    const field = template.fields.find((f) => f.name === fieldName);
    if (!field) return null;

    let prompt = `${field.label}`;

    if (field.description) {
      prompt += `\n${field.description}`;
    }

    if (field.placeholder) {
      prompt += `\n(Example: ${field.placeholder})`;
    }

    return prompt;
  }

  /**
   * Generate a natural language summary of missing fields
   */
  static getMissingFieldsSummary(
    templateId: string,
    collectedFields: Record<string, any>
  ): string {
    const template = getDocumentTemplate(templateId);
    if (!template) return 'Unknown template';

    const missingFieldNames = getMissingFields(templateId, collectedFields);

    if (missingFieldNames.length === 0) {
      return 'All required fields collected!';
    }

    const missingFields = missingFieldNames
      .map((name) => template.fields.find((f) => f.name === name))
      .filter((f): f is DocumentField => !!f);

    const fieldList = missingFields
      .map((field, index) => {
        let line = `${index + 1}. **${field.label}**`;
        if (field.description) {
          line += ` - ${field.description}`;
        }
        if (field.placeholder) {
          line += `\n   Example: \`${field.placeholder}\``;
        }
        return line;
      })
      .join('\n\n');

    return `I need the following information to generate your **${template.name}**:\n\n${fieldList}\n\nPlease provide these details.`;
  }

  /**
   * Parse natural language property links from text
   * Handles formats like:
   * - "https://link1.com, https://link2.com"
   * - "link1\nlink2"
   * - "Property 1: link1, Property 2: link2"
   */
  static parsePropertyLinks(text: string): string[] {
    if (!text) return [];

    // Extract all URLs from text
    const urlRegex = /https?:\/\/[^\s,\n]+/g;
    const matches = text.match(urlRegex);

    return matches || [];
  }

  /**
   * Format property links for email/document
   */
  static formatPropertyLinks(links: string[]): string {
    if (links.length === 0) return '';
    if (links.length === 1) return links[0]; // Single link, no numbering

    // Multiple links: format as Property 1: [LINK], Property 2: [LINK]
    return links
      .map((link, index) => `Property ${index + 1}: ${link}`)
      .join('\n');
  }
}
