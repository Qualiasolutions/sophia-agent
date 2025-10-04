/**
 * Document Collection Service
 *
 * Manages multi-turn conversations for collecting document information
 * - Tracks collection progress
 * - Determines missing fields
 * - Generates prompts for missing data
 * - Validates completeness
 * - Stores/retrieves partial sessions
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  DocumentTemplate,
  DocumentRequestSession,
  getDocumentTemplate,
  getMissingFields,
  DocumentCategory,
} from '@sophiaai/shared';
import { DocumentValidatorService } from './document-validator.service';

export class DocumentCollectionService {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Start a new document request session
   */
  async startSession(
    agentId: string,
    templateId: string
  ): Promise<DocumentRequestSession> {
    const template = getDocumentTemplate(templateId);
    if (!template) {
      throw new Error(`Unknown template: ${templateId}`);
    }

    const session: Omit<DocumentRequestSession, 'id'> = {
      agent_id: agentId,
      document_template_id: templateId,
      collected_fields: {},
      missing_fields: template.fields
        .filter((f) => f.required)
        .map((f) => f.name),
      status: 'collecting',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from('document_request_sessions')
      .insert([session])
      .select()
      .single();

    if (error) throw error;
    return data as DocumentRequestSession;
  }

  /**
   * Update session with new field data
   */
  async updateSession(
    sessionId: string,
    newFields: Record<string, any>
  ): Promise<DocumentRequestSession> {
    // Get current session
    const { data: currentSession, error: fetchError } = await this.supabase
      .from('document_request_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError) throw fetchError;

    const session = currentSession as DocumentRequestSession;
    const template = getDocumentTemplate(session.document_template_id);
    if (!template) {
      throw new Error(`Unknown template: ${session.document_template_id}`);
    }

    // Merge new fields with collected fields
    const collectedFields = {
      ...session.collected_fields,
      ...newFields,
    };

    // Process fields (phone masking, bank extraction, etc.)
    const processedFields = DocumentValidatorService.processFields(
      session.document_template_id,
      collectedFields
    );

    // Determine missing fields
    const missingFields = getMissingFields(
      session.document_template_id,
      processedFields
    );

    // Validate if complete
    const validation = DocumentValidatorService.validateFields(
      session.document_template_id,
      processedFields
    );

    const updatedSession = {
      collected_fields: processedFields,
      missing_fields: missingFields,
      status:
        missingFields.length === 0
          ? validation.valid
            ? 'complete'
            : 'validating'
          : 'collecting',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from('document_request_sessions')
      .update(updatedSession as any)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data as DocumentRequestSession;
  }

  /**
   * Get active session for agent and template (if exists)
   */
  async getActiveSession(
    agentId: string,
    templateId?: string
  ): Promise<DocumentRequestSession | null> {
    let query = this.supabase
      .from('document_request_sessions')
      .select('*')
      .eq('agent_id', agentId)
      .in('status', ['collecting', 'validating'])
      .order('updated_at', { ascending: false })
      .limit(1);

    if (templateId) {
      query = query.eq('document_template_id', templateId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned"
      throw error;
    }

    return data as DocumentRequestSession | null;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<DocumentRequestSession | null> {
    const { data, error } = await this.supabase
      .from('document_request_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as DocumentRequestSession | null;
  }

  /**
   * Generate prompt for next missing field(s)
   */
  getNextPrompt(session: DocumentRequestSession): string {
    const template = getDocumentTemplate(session.document_template_id);
    if (!template) {
      return 'Error: Unknown template';
    }

    if (session.missing_fields.length === 0) {
      return 'All required information collected! Generating document...';
    }

    // Use the validator to generate a nice summary
    return DocumentValidatorService.getMissingFieldsSummary(
      session.document_template_id,
      session.collected_fields
    );
  }

  /**
   * Mark session as complete and ready for document generation
   */
  async markSessionComplete(sessionId: string): Promise<void> {
    await this.supabase
      .from('document_request_sessions')
      .update({
        status: 'generating',
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', sessionId);
  }

  /**
   * Mark session as sent (document delivered)
   */
  async markSessionSent(sessionId: string): Promise<void> {
    await this.supabase
      .from('document_request_sessions')
      .update({
        status: 'sent',
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', sessionId);
  }

  /**
   * Cancel/delete session
   */
  async cancelSession(sessionId: string): Promise<void> {
    await this.supabase
      .from('document_request_sessions')
      .delete()
      .eq('id', sessionId);
  }

  /**
   * Parse agent message and extract field values
   * Uses simple pattern matching for common field patterns
   */
  parseFieldsFromMessage(
    templateId: string,
    message: string
  ): Record<string, any> {
    const template = getDocumentTemplate(templateId);
    if (!template) return {};

    const extracted: Record<string, any> = {};

    // Try to extract common patterns
    // URLs
    const urlMatches = message.match(/https?:\/\/[^\s,\n]+/g);
    if (urlMatches && urlMatches.length > 0) {
      // Try to assign to appropriate URL fields
      const urlFields = template.fields.filter((f) => f.type === 'url');
      urlFields.forEach((field, index) => {
        if (urlMatches[index]) {
          extracted[field.name] = urlMatches[index];
        }
      });
    }

    // Phone numbers (with various formats)
    const phoneMatches = message.match(/(\+?\d[\d\s\-\(\)]{7,})/g);
    if (phoneMatches && phoneMatches.length > 0) {
      const phoneFields = template.fields.filter((f) => f.type === 'phone');
      phoneFields.forEach((field, index) => {
        if (phoneMatches[index]) {
          extracted[field.name] = phoneMatches[index].trim();
        }
      });
    }

    // Percentages (for fees)
    const percentMatch = message.match(/(\d+)%/);
    if (percentMatch) {
      const feeField = template.fields.find(
        (f) =>
          f.name.includes('fee') &&
          (f.type === 'number' || f.type === 'text')
      );
      if (feeField) {
        extracted[feeField.name] = parseInt(percentMatch[1]);
      }
    }

    // Named patterns (e.g., "client: John Doe")
    template.fields.forEach((field) => {
      // Try to match field label or name in message
      const patterns = [
        new RegExp(`${field.label}:?\\s*([^,\\.\\n]+)`, 'i'),
        new RegExp(`${field.name}:?\\s*([^,\\.\\n]+)`, 'i'),
      ];

      for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
          extracted[field.name] = match[1].trim();
          break;
        }
      }
    });

    return extracted;
  }

  /**
   * Determine template type from agent request
   * Returns template ID or array of candidates if ambiguous
   */
  async determineTemplateFromRequest(
    message: string
  ): Promise<string | string[] | null> {
    const lowerMessage = message.toLowerCase();

    // Registration forms
    if (
      lowerMessage.includes('registration') ||
      lowerMessage.includes('register')
    ) {
      // Determine which type
      if (lowerMessage.includes('bank') || lowerMessage.includes('remu')) {
        if (lowerMessage.includes('land') || lowerMessage.includes('plot')) {
          return 'reg_banks_land';
        }
        return 'reg_banks_property';
      }

      if (lowerMessage.includes('developer')) {
        if (lowerMessage.includes('viewing arranged')) {
          return 'reg_developers_viewing_arranged';
        }
        return ['reg_developers_viewing_arranged', 'reg_developers_no_viewing'];
      }

      if (
        lowerMessage.includes('owner') ||
        lowerMessage.includes('seller')
      ) {
        if (lowerMessage.includes('rental') || lowerMessage.includes('rent')) {
          return 'reg_owners_rental';
        }
        if (
          lowerMessage.includes('marketing') ||
          lowerMessage.includes('agreement')
        ) {
          return 'reg_owners_with_marketing_agreement';
        }
        if (lowerMessage.includes('advanced') || lowerMessage.includes('multiple')) {
          return 'reg_owners_advanced';
        }
        return 'reg_owners_standard';
      }

      // Ambiguous - return registration options
      return [
        'reg_banks_property',
        'reg_developers_viewing_arranged',
        'reg_owners_standard',
      ];
    }

    // Viewing forms
    if (lowerMessage.includes('viewing form')) {
      if (lowerMessage.includes('advanced')) {
        return 'viewing_form_advanced';
      }
      if (lowerMessage.includes('standard') || lowerMessage.includes('simple')) {
        return 'viewing_form_standard';
      }
      if (lowerMessage.includes('email') || lowerMessage.includes('plot')) {
        return 'email_viewing_form_step1';
      }
      return ['viewing_form_advanced', 'viewing_form_standard'];
    }

    // Email templates
    if (lowerMessage.includes('email') || lowerMessage.includes('message')) {
      if (lowerMessage.includes('valuation')) {
        return 'email_valuation_quote';
      }
      if (lowerMessage.includes('still looking')) {
        return 'email_still_looking';
      }
      if (
        lowerMessage.includes('good client') ||
        lowerMessage.includes('request')
      ) {
        return 'email_good_client_request';
      }
      if (
        lowerMessage.includes('options') ||
        lowerMessage.includes('properties')
      ) {
        return 'email_send_options_unsatisfied';
      }
      if (lowerMessage.includes('low budget') || lowerMessage.includes('no options')) {
        return 'email_no_options_low_budget';
      }
    }

    // Agreements
    if (lowerMessage.includes('agreement')) {
      if (lowerMessage.includes('exclusive')) {
        return 'agreement_exclusive_selling';
      }
      if (lowerMessage.includes('marketing')) {
        return 'agreement_marketing_email';
      }
      return ['agreement_exclusive_selling', 'agreement_marketing_email'];
    }

    return null; // Could not determine
  }
}
