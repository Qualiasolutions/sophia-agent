/**
 * Document Service
 * AI-powered document completion from Knowledge Base templates
 * Epic 2 (Re-implementation): Natural language document generation
 */

import OpenAI from 'openai';
import {
  getTemplateWithCache,
  findTemplateByName,
  type TemplateContent,
} from './knowledge-base.service';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface DocumentRequest {
  templateName: string;
  variables: Record<string, any>;
  rawMessage: string;
}

export interface CompletedDocument {
  templateName: string;
  content: string;
  warnings?: string[];
}

/**
 * Parse a natural language document request from an agent
 * Example: "Sophia, I want reg_banks with Fawzi Goussous, Bank of Cyprus, link https://..."
 */
export async function parseDocumentRequest(
  message: string
): Promise<DocumentRequest | null> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a document request parser for real estate agents.
Extract the template name and variables from their WhatsApp messages.

Common template patterns:
- "reg_banks" or "registration banks" -> Reg_Banks.docx
- "reg_developers" -> Reg_Developers_.docx
- "viewing form" -> Email_For_Viewing_Form.docx
- "exclusive agreement" -> EXCLUSIVE AGREEMENT NEW_via_email.docx
- "marketing agreement" -> Marketing_Agreement.docx

Extract all details mentioned: names, phone numbers, property links, banks, etc.
Return JSON: {"template_name": "...", "variables": {...}}`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    if (!result.template_name) {
      return null;
    }

    return {
      templateName: result.template_name,
      variables: result.variables || {},
      rawMessage: message,
    };
  } catch (error) {
    console.error('[Document Service] Failed to parse request:', error);
    return null;
  }
}

/**
 * Complete a document template with provided variables
 * Uses AI to understand template structure and fill appropriately
 */
export async function completeDocument(
  templateName: string,
  variables: Record<string, any>,
  agentMessage: string
): Promise<CompletedDocument> {
  // Find and read the template
  const template = await findTemplateByName(templateName);

  if (!template) {
    throw new Error(`Template not found: ${templateName}`);
  }

  const templateContent = await getTemplateWithCache(template.filename);

  // Use OpenAI to complete the document
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are Sophia, an AI assistant for Zyprus real estate agents.

Your task: Fill in document templates with information from agent messages.

KEY RULES:
1. **Phone Masking**: Hide middle digits - 99 07 67 32 becomes 99 ** 67 32
2. **Bank Detection**: Extract bank name from property link or ask if needed
3. **Conditional Sections**:
   - Land properties need "Please find attached the viewing form" reminder
   - Regular properties don't need viewing form
4. **Link Handling**: Extract all URLs from agent message
5. **Follow Template Instructions**: The template contains instructions - follow them exactly
6. **Preserve Formatting**: Keep the document structure intact

Return ONLY the completed document text, ready to send via WhatsApp.`,
      },
      {
        role: 'user',
        content: `Template Document:\n${templateContent.content}\n\n---\n\nAgent Message: ${agentMessage}\n\n---\n\nComplete this document using the information from the agent's message. Follow all template instructions.`,
      },
    ],
    temperature: 0.2,
  });

  const content = completion.choices[0].message.content || '';
  const warnings: string[] = [];

  // Check for common issues
  if (!content.includes('**')) {
    // Check if phone numbers were masked
    const phonePattern = /\d{2}\s+\d{2}\s+\d{2}\s+\d{2}/;
    if (phonePattern.test(content)) {
      warnings.push('Phone numbers may not be properly masked');
    }
  }

  return {
    templateName: template.displayName,
    content,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
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

/**
 * Mask phone number for privacy
 * Example: "99 07 67 32" -> "99 ** 67 32"
 */
export function maskPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Cyprus mobile: +357 99 07 67 32 or 99 07 67 32
  if (cleaned.startsWith('+357')) {
    const digits = cleaned.substring(4); // Remove +357
    if (digits.length === 8) {
      return `+357 ${digits.substring(0, 2)} ** ${digits.substring(4, 6)} ${digits.substring(6)}`;
    }
  } else if (cleaned.length === 8) {
    return `${cleaned.substring(0, 2)} ** ${cleaned.substring(4, 6)} ${cleaned.substring(6)}`;
  }

  // International format: mask middle portion
  if (cleaned.length >= 10) {
    const start = cleaned.substring(0, 4);
    const end = cleaned.substring(cleaned.length - 4);
    return `${start} ** ${end}`;
  }

  return phone; // Return original if pattern doesn't match
}

/**
 * Extract property links from message
 */
export function extractPropertyLinks(message: string): string[] {
  const urlPattern = /https?:\/\/[^\s]+/g;
  const matches = message.match(urlPattern);
  return matches || [];
}

/**
 * Detect bank name from property link
 */
export function detectBankFromLink(link: string): string | null {
  const bankPatterns = {
    'Remu Properties': /remuproperties\.com/i,
    'Gordian': /gordian/i,
    'Altia': /altia/i,
    'Altamira': /altamira/i,
  };

  for (const [bank, pattern] of Object.entries(bankPatterns)) {
    if (pattern.test(link)) {
      return bank;
    }
  }

  return null;
}
