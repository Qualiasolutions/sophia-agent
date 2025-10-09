/**
 * Template Migration Service
 *
 * Handles migration from text-based templates to enhanced structured format
 */

import { createClient } from '@supabase/supabase-js';

export class TemplateMigrationService {
  /**
   * Migrate existing markdown templates to enhanced structure
   */
  async migrateToEnhancedFormat(): Promise<void> {
    console.log('Starting template migration to enhanced format...');

    // 1. Read existing templates from template_cache
    const { data: templates, error } = await supabase
      .from('template_cache')
      .select('*')
      .eq('category', 'registration');

    if (error) {
      console.error('Error fetching templates:', error);
      return;
    }

    console.log(`Found ${templates.length} templates to migrate`);

    // 2. Create enhanced template table
    await this.createEnhancedTemplateTable();

    // 3. Convert each template
    for (const template of templates) {
      const enhanced = await this.convertToEnhanced(template);
      await this.saveEnhancedTemplate(enhanced);
      console.log(`✅ Migrated: ${template.template_id}`);
    }

    // 4. Update template version in system_config
    await this.updateTemplateVersion('2.0.0');

    console.log('Migration completed successfully!');
  }

  /**
   * Convert markdown template to enhanced structure
   */
  private async convertToEnhanced(template: any): Promise<any> {
    // Extract variables from template content
    const variables = this.extractVariables(template.content);

    // Generate flow based on template type
    const flow = this.generateFlow(template.template_id);

    // Calculate metrics from usage data
    const metrics = await this.calculateMetrics(template.template_id);

    return {
      id: template.template_id,
      name: template.name,
      version: '2.0.0',
      category: template.category,
      subcategory: template.subcategory,

      metadata: {
        priority: this.calculatePriority(template.template_id),
        estimatedTokens: template.estimated_tokens || 150,
        averageResponseTime: metrics.avgResponseTime || 2000,
        complexity: this.determineComplexity(template),
        confidence: 0.95
      },

      triggers: {
        keywords: this.extractKeywords(template),
        phrases: this.generatePhrases(template.template_id),
        patterns: this.generatePatterns(template.template_id),
        semanticExamples: this.generateSemanticExamples(template.template_id)
      },

      flow,

      fields: {
        required: this.buildFieldDefinitions(template.required_fields, 'required'),
        optional: this.buildFieldDefinitions(template.optional_fields, 'optional'),
        conditional: this.buildConditionalFields(template.template_id)
      },

      content: {
        subject: template.subject_line,
        body: template.content,
        variables: this.buildVariableMappings(variables),
        formatting: {
          boldLabels: true,
          maskPhoneNumbers: true,
          dateFormat: 'DD/MM/YYYY',
          currencyFormat: '€€€,###',
          lineBreaks: 'preserve'
        }
      },

      instructions: {
        systemPrompt: this.generateSystemPrompt(template.template_id),
        examples: this.generateExamples(template.template_id),
        constraints: this.generateConstraints(template.template_id),
        outputFormat: 'exact'
      },

      analytics: {
        usageCount: metrics.usageCount || 0,
        successRate: metrics.successRate || 1.0,
        lastUsed: metrics.lastUsed || new Date(),
        feedback: metrics.feedback || []
      }
    };
  }

  /**
   * Extract variables from template content
   */
  private extractVariables(content: string): string[] {
    const regex = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = regex.exec(content)) !== null) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  }

  /**
   * Generate flow structure based on template type
   */
  private generateFlow(templateId: string): any {
    if (!templateId.startsWith('seller_registration')) {
      return undefined;
    }

    return {
      steps: [
        {
          id: 'category',
          type: 'question',
          content: 'What type of registration do you need?\n1. **Seller/Owner Registration** (property owners)\n2. **Developer Registration** (new constructions/developments)\n3. **Bank Registration** (bank-owned properties/land)',
          options: ['seller', 'developer', 'bank'],
          nextStep: 'seller_type'
        },
        {
          id: 'seller_type',
          type: 'question',
          content: 'Which seller registration do you need?\n1. **Standard Registration** - Regular property registration\n2. **With Marketing Agreement** - Includes marketing terms\n3. **Rental Property** - For landlords/rentals\n4. **Advanced** - Multiple properties or special terms',
          options: ['standard', 'marketing', 'rental', 'advanced'],
          condition: 'previous_step === "seller"'
        }
      ],
      decisionPoints: [
        {
          question: 'Will this registration be sent to multiple sellers?',
          options: [
            { value: 'yes', nextStep: 'collect_coowners' },
            { value: 'no', nextStep: 'collect_fields' }
          ]
        }
      ]
    };
  }

  /**
   * Calculate priority based on usage statistics
   */
  private calculatePriority(templateId: string): number {
    // Priority based on template type and usage
    const priorityMap: Record<string, number> = {
      'seller_registration_standard': 9,
      'seller_registration_marketing': 7,
      'rental_registration': 6,
      'bank_registration_property': 5,
      'developer_registration_viewing': 6
    };

    return priorityMap[templateId] || 5;
  }

  /**
   * Extract keywords from template metadata
   */
  private extractKeywords(template: any): string[] {
    const keywords: string[] = [];

    // Add category keywords
    if (template.category === 'registration') {
      keywords.push('registration', 'register');
    }

    // Add subcategory keywords
    if (template.subcategory === 'seller') {
      keywords.push('seller', 'owner', 'property');
    } else if (template.subcategory === 'bank') {
      keywords.push('bank', 'remu', 'gordian');
    } else if (template.subcategory === 'developer') {
      keywords.push('developer', 'construction', 'project');
    }

    // Add template-specific keywords
    const templateKeywords: Record<string, string[]> = {
      'seller_registration_standard': ['standard', 'regular'],
      'seller_registration_marketing': ['marketing', 'agreement'],
      'rental_registration': ['rental', 'landlord', 'tenant'],
      'bank_registration_property': ['property', 'remu'],
      'bank_registration_land': ['land', 'parcel']
    };

    return keywords.concat(templateKeywords[template.template_id] || []);
  }

  /**
   * Build field definitions from field arrays
   */
  private buildFieldDefinitions(fields: string[], type: 'required' | 'optional'): any[] {
    return fields.map(fieldName => ({
      name: fieldName,
      type: this.inferFieldType(fieldName),
      label: this.formatLabel(fieldName),
      placeholder: this.generatePlaceholder(fieldName),
      validation: type === 'required'
        ? [{ type: 'required', value: true, message: `${this.formatLabel(fieldName)} is required` }]
        : []
    }));
  }

  /**
   * Infer field type from field name
   */
  private inferFieldType(fieldName: string): string {
    const lower = fieldName.toLowerCase();

    if (lower.includes('email')) return 'email';
    if (lower.includes('phone')) return 'phone';
    if (lower.includes('date') || lower.includes('datetime')) return 'datetime';
    if (lower.includes('price') || lower.includes('fee')) return 'currency';
    if (lower.includes('url') || lower.includes('link')) return 'url';
    if (lower.includes('number') || lower.includes('percent')) return 'number';

    return 'text';
  }

  /**
   * Format field name to label
   */
  private formatLabel(fieldName: string): string {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Generate placeholder for field
   */
  private generatePlaceholder(fieldName: string): string {
    const placeholders: Record<string, string> = {
      'seller_name': 'Full legal name of seller',
      'buyer_names': 'Full legal names of all buyers',
      'property_description': 'Address and brief description',
      'viewing_datetime': 'Date and time of property viewing',
      'agency_fee_percent': 'Agency fee percentage (e.g., 2.0)',
      'client_phone': 'Client phone number (99 123 456)',
      'property_url_or_description': 'Property URL or description'
    };

    return placeholders[fieldName] || `Enter ${this.formatLabel(fieldName)}`;
  }

  /**
   * Generate system prompt for template
   */
  private generateSystemPrompt(templateId: string): string {
    const basePrompt = `You are generating a document for Zyprus Real Estate.

CRITICAL RULES:
- Use EXACT template wording with {{VARIABLE}} replacements
- Bold field labels with *asterisks* (format: *Field Name:*)
- Never invent information - ask for missing fields
- Mask phone numbers: 99 07 67 32 → 99 XX 67 32
- Output only the document content
- No confirmation step once all fields are collected`;

    const templateSpecific = this.getTemplateSpecificInstructions(templateId);

    return basePrompt + '\n\n' + templateSpecific;
  }

  /**
   * Get template-specific instructions
   */
  private getTemplateSpecificInstructions(templateId: string): string {
    const instructions: Record<string, string> = {
      'seller_registration_standard': `This is a STANDARD SELLER REGISTRATION.
Include property details, buyer information, and viewing details.
Emphasize exclusivity period of 6 months.`,

      'seller_registration_marketing': `This is a SELLER REGISTRATION WITH MARKETING AGREEMENT.
Include marketing terms and agency fee details.
Highlight the no-direct-contact clause.`,

      'bank_registration_property': `This is a BANK PROPERTY REGISTRATION.
Include bank representative details and property reference.
Use formal tone suitable for bank communication.`
    };

    return instructions[templateId] || 'Generate a professional document following the template.';
  }

  /**
   * Create enhanced_template table
   */
  private async createEnhancedTemplateTable(): Promise<void> {
    const { error } = await supabase.rpc('create_enhanced_template_table');

    if (error && !error.message.includes('already exists')) {
      console.error('Error creating enhanced template table:', error);
    }
  }

  /**
   * Save enhanced template to database
   */
  private async saveEnhancedTemplate(enhanced: any): Promise<void> {
    const { error } = await supabase
      .from('enhanced_templates')
      .insert(enhanced);

    if (error) {
      console.error('Error saving enhanced template:', error);
    }
  }

  /**
   * Update template version in system config
   */
  private async updateTemplateVersion(version: string): Promise<void> {
    await supabase
      .from('system_config')
      .upsert({
        key: 'template_version',
        value: version,
        updated_at: new Date()
      });
  }

  /**
   * Calculate metrics for template
   */
  private async calculateMetrics(templateId: string): Promise<any> {
    // Query usage data
    const { data } = await supabase
      .from('optimized_document_generations')
      .select('processing_time, created_at, success')
      .eq('template_id', templateId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!data || data.length === 0) {
      return {};
    }

    const usageCount = data.length;
    const avgResponseTime = data.reduce((sum, d) => sum + d.processing_time, 0) / usageCount;
    const successRate = data.filter(d => d.success).length / usageCount;
    const lastUsed = new Date(data[0].created_at);

    return {
      usageCount,
      avgResponseTime,
      successRate,
      lastUsed
    };
  }

  /**
   * Determine complexity of template
   */
  private determineComplexity(template: any): 'simple' | 'medium' | 'complex' {
    const variableCount = (template.required_fields?.length || 0) + (template.optional_fields?.length || 0);
    const contentLength = template.content?.length || 0;

    if (variableCount <= 4 && contentLength < 1000) return 'simple';
    if (variableCount <= 8 && contentLength < 2000) return 'medium';
    return 'complex';
  }

  /**
   * Generate phrases for template matching
   */
  private generatePhrases(templateId: string): string[] {
    const phrases: Record<string, string[]> = {
      'seller_registration_standard': [
        'i need a registration',
        'seller registration',
        'register my property',
        'standard registration'
      ],
      'bank_registration_property': [
        'bank registration',
        'bank property registration',
        'remu registration'
      ],
      'developer_registration_viewing': [
        'developer registration',
        'new construction registration',
        'developer with viewing'
      ]
    };

    return phrases[templateId] || [];
  }

  /**
   * Generate regex patterns for template matching
   */
  private generatePatterns(templateId: string): string[] {
    const patterns: Record<string, string[]> = {
      'seller_registration_standard': [
        '\\b(registration|register)\\b.*\\b(seller|property)\\b',
        '\\b(standard|regular)\\s+registration\\b'
      ],
      'bank_registration_property': [
        '\\b(bank|remu|gordian)\\b.*\\b(registration|property)\\b'
      ]
    };

    return patterns[templateId] || [];
  }

  /**
   * Generate semantic examples
   */
  private generateSemanticExamples(templateId: string): string[] {
    return [
      'I want to register my property for sale',
      'Client needs to register their property',
      'We need to do a registration for the seller'
    ];
  }

  /**
   * Build variable mappings
   */
  private buildVariableMappings(variables: string[]): any[] {
    return variables.map(variable => ({
      template: `{{${variable.toUpperCase()}}}`,
      mapping: variable,
      transform: this.getTransformFunction(variable)
    }));
  }

  /**
   * Get transform function for variable
   */
  private getTransformFunction(variable: string): string | undefined {
    if (variable.includes('phone')) return 'maskPhone';
    if (variable.includes('date')) return 'formatDate';
    if (variable.includes('price')) return 'formatCurrency';
    return undefined;
  }

  /**
   * Build conditional fields
   */
  private buildConditionalFields(templateId: string): any[] {
    if (templateId.includes('seller')) {
      return [
        {
          name: 'multiple_sellers',
          condition: 'co_owners === true',
          fields: [
            {
              name: 'co_owner_names',
              type: 'text',
              label: 'Co-owner Names',
              placeholder: 'Names of all co-owners'
            }
          ]
        }
      ];
    }

    return [];
  }

  /**
   * Generate examples for template
   */
  private generateExamples(templateId: string): any[] {
    return [
      {
        input: 'seller: John Smith, buyers: Mary & Tom Jones, property: 123 Main St, viewing: tomorrow 2pm',
        output: 'Dear John Smith,\n\nThis registration...',
        explanation: 'Basic information mapping to template'
      }
    ];
  }

  /**
   * Generate constraints for template
   */
  private generateConstraints(templateId: string): string[] {
    return [
      'Do not add any information not provided by user',
      'Follow exact template format',
      'Maintain professional tone',
      'Include all mandatory sections',
      'Bold all field labels'
    ];
  }
}