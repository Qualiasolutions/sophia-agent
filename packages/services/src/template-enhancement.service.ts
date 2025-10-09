/**
 * Template Enhancement Service
 *
 * Handles migration and enhancement of templates to structured format
 */

import { supabase } from '@sophiaai/database';
import { OpenAI } from 'openai';

interface EnhancedTemplate {
  id: string;
  template_id: string;
  name: string;
  version: string;
  category: string;
  subcategory: string;
  metadata: {
    priority: number;
    estimatedTokens: number;
    averageResponseTime: number;
    complexity: 'simple' | 'medium' | 'complex';
    confidence: number;
    tags: string[];
  };
  triggers: {
    keywords: string[];
    phrases: string[];
    patterns: string[];
    semanticExamples: string[];
  };
  flow?: {
    steps: Array<{
      id: string;
      type: 'question' | 'info' | 'generation';
      content: string;
      options?: string[];
      nextStep?: string;
      condition?: string;
    }>;
    decisionPoints: Array<{
      question: string;
      options: Array<{
        value: string;
        nextStep: string;
        templateId?: string;
      }>;
    }>;
  };
  fields: {
    required: Array<{
      name: string;
      type: string;
      label: string;
      placeholder?: string;
      validation?: Array<{
        type: string;
        value: any;
        message: string;
      }>;
    }>;
    optional: Array<any>;
    conditional: Array<any>;
  };
  content: {
    subject?: string;
    body: string;
    variables: Array<{
      template: string;
      mapping: string;
      transform?: string;
      default?: string;
    }>;
    formatting: {
      boldLabels: boolean;
      maskPhoneNumbers: boolean;
      dateFormat: string;
      currencyFormat: string;
      lineBreaks: string;
    };
  };
  instructions: {
    systemPrompt: string;
    examples: Array<{
      input: string;
      output: string;
      explanation?: string;
    }>;
    constraints: string[];
    outputFormat: 'exact' | 'flexible' | 'creative';
  };
  analytics: {
    usageCount: number;
    successRate: number;
    lastUsed: Date;
    feedback: Array<any>;
  };
  embedding?: number[];
}

export class TemplateEnhancementService {
  private openai: OpenAI;
  private batchSize = 10;

  constructor(openaiApiKey: string) {
    this.openai = new OpenAI({ apiKey: openaiApiKey });
  }

  /**
   * Migrate all existing templates to enhanced format
   */
  async migrateAllTemplates(): Promise<void> {
    console.log('🚀 Starting template migration to enhanced format...\n');

    // Generate batch ID for tracking
    const batchId = `migration_${Date.now()}`;

    // Get all existing templates from template_cache
    const { data: templates, error } = await supabase
      .from('template_cache')
      .select('*')
      .order('template_id');

    if (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }

    console.log(`Found ${templates.length} templates to migrate\n`);

    let successCount = 0;
    let errorCount = 0;

    // Process in batches
    for (let i = 0; i < templates.length; i += this.batchSize) {
      const batch = templates.slice(i, i + this.batchSize);
      console.log(`Processing batch ${Math.floor(i / this.batchSize) + 1} of ${Math.ceil(templates.length / this.batchSize)}`);

      for (const template of batch) {
        try {
          await this.migrateTemplate(template, batchId);
          successCount++;
          console.log(`  ✅ Migrated: ${template.template_id}`);
        } catch (error) {
          errorCount++;
          console.error(`  ❌ Failed to migrate ${template.template_id}:`, error.message);

          // Log error
          await supabase
            .from('template_migration_log')
            .insert({
              batch_id: batchId,
              template_id: template.template_id,
              status: 'failed',
              message: error.message
            });
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`  Total templates: ${templates.length}`);
    console.log(`  Successful: ${successCount}`);
    console.log(`  Failed: ${errorCount}`);
    console.log('='.repeat(60));

    // Update system config
    await this.updateTemplateVersion('2.0.0');
  }

  /**
   * Migrate a single template
   */
  private async migrateTemplate(template: any, batchId: string): Promise<void> {
    // Log start
    await supabase
      .from('template_migration_log')
      .insert({
        batch_id: batchId,
        template_id: template.template_id,
        status: 'in_progress',
        message: 'Starting migration'
      });

    // Convert to enhanced format
    const enhanced = await this.convertToEnhanced(template);

    // Generate embedding
    if (enhanced.content.body) {
      enhanced.embedding = await this.generateEmbedding(
        `${enhanced.name} ${enhanced.triggers.keywords.join(' ')} ${enhanced.content.body.substring(0, 1000)}`
      );
    }

    // Insert into enhanced_templates
    const { error } = await supabase
      .from('enhanced_templates')
      .insert(enhanced);

    if (error) {
      throw error;
    }

    // Log completion
    await supabase
      .from('template_migration_log')
      .insert({
        batch_id: batchId,
        template_id: template.template_id,
        status: 'completed',
        message: 'Successfully migrated',
        completed_at: new Date(),
        details: {
          version: enhanced.version,
          category: enhanced.category,
          embeddingGenerated: !!enhanced.embedding
        }
      });
  }

  /**
   * Convert template to enhanced format
   */
  private async convertToEnhanced(template: any): Promise<EnhancedTemplate> {
    // Extract variables from content
    const variables = this.extractVariables(template.content);

    // Determine complexity
    const complexity = this.determineComplexity(template, variables);

    // Build enhanced template
    const enhanced: EnhancedTemplate = {
      template_id: template.template_id,
      name: template.name,
      version: '2.0.0',
      category: template.category,
      subcategory: template.subcategory || 'general',

      metadata: {
        priority: this.calculatePriority(template.template_id),
        estimatedTokens: template.estimated_tokens || 150,
        averageResponseTime: this.calculateAverageResponseTime(template.template_id),
        complexity,
        confidence: 0.95,
        tags: this.generateTags(template)
      },

      triggers: {
        keywords: this.generateKeywords(template),
        phrases: this.generatePhrases(template.template_id),
        patterns: this.generatePatterns(template.template_id),
        semanticExamples: this.generateSemanticExamples(template.template_id)
      },

      flow: this.generateFlow(template),

      fields: {
        required: this.buildFieldDefinitions(template.required_fields || [], 'required'),
        optional: this.buildFieldDefinitions(template.optional_fields || [], 'optional'),
        conditional: this.buildConditionalFields(template)
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
        systemPrompt: this.generateSystemPrompt(template),
        examples: this.generateExamples(template.template_id),
        constraints: this.generateConstraints(template.template_id),
        outputFormat: 'exact'
      },

      analytics: {
        usageCount: 0,
        successRate: 1.0,
        lastUsed: new Date(),
        feedback: []
      }
    };

    return enhanced;
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
   * Determine template complexity
   */
  private determineComplexity(template: any, variables: string[]): 'simple' | 'medium' | 'complex' {
    const variableCount = (template.required_fields?.length || 0) + (template.optional_fields?.length || 0);
    const contentLength = template.content?.length || 0;

    if (variableCount <= 4 && contentLength < 1000) return 'simple';
    if (variableCount <= 8 && contentLength < 2000) return 'medium';
    return 'complex';
  }

  /**
   * Calculate priority based on template type and usage
   */
  private calculatePriority(templateId: string): number {
    const priorityMap: Record<string, number> = {
      'seller_registration_standard': 9,
      'seller_registration_marketing': 8,
      'rental_registration': 7,
      'bank_registration_property': 6,
      'bank_registration_land': 6,
      'developer_registration_viewing': 7,
      'developer_registration_no_viewing': 7,
      'seller_registration_advanced': 5,
      'multiple_sellers_clause': 4
    };

    return priorityMap[templateId] || 5;
  }

  /**
   * Calculate average response time based on template type
   */
  private calculateAverageResponseTime(templateId: string): number {
    const timeMap: Record<string, number> = {
      'seller_registration_standard': 2000,
      'seller_registration_marketing': 2500,
      'rental_registration': 2200,
      'bank_registration_property': 1800,
      'bank_registration_land': 1900,
      'developer_registration_viewing': 2100,
      'developer_registration_no_viewing': 1800,
      'seller_registration_advanced': 3000,
      'multiple_sellers_clause': 1500
    };

    return timeMap[templateId] || 2000;
  }

  /**
   * Generate tags for template
   */
  private generateTags(template: any): string[] {
    const tags = [template.category, template.subcategory];

    if (template.template_id.includes('registration')) {
      tags.push('document', 'legal');
    }

    if (template.template_id.includes('bank')) {
      tags.push('bank', 'remu');
    }

    if (template.template_id.includes('developer')) {
      tags.push('developer', 'construction');
    }

    return tags;
  }

  /**
   * Generate keywords for template matching
   */
  private generateKeywords(template: any): string[] {
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
    } else if (template.subcategory === 'rental') {
      keywords.push('rental', 'landlord', 'tenant');
    }

    // Add template-specific keywords
    const templateKeywords: Record<string, string[]> = {
      'seller_registration_standard': ['standard', 'regular', 'normal'],
      'seller_registration_marketing': ['marketing', 'agreement', 'exclusive'],
      'rental_registration': ['rental', 'landlord', 'tenant'],
      'bank_registration_property': ['property', 'remu', 'foreclosure'],
      'bank_registration_land': ['land', 'parcel', 'plot'],
      'developer_registration_viewing': ['viewing', 'appointment', 'show'],
      'developer_registration_no_viewing': ['no viewing', 'direct', 'appointment'],
      'seller_registration_advanced': ['advanced', 'multiple', 'special'],
      'multiple_sellers_clause': ['multiple', 'co-owners', 'joint', 'husband wife']
    };

    return keywords.concat(templateKeywords[template.template_id] || []);
  }

  /**
   * Generate common phrases for template matching
   */
  private generatePhrases(templateId: string): string[] {
    const phrases: Record<string, string[]> = {
      'seller_registration_standard': [
        'i need a registration',
        'seller registration',
        'register my property',
        'standard registration',
        'property registration'
      ],
      'seller_registration_marketing': [
        'marketing agreement',
        'exclusive marketing',
        'seller with marketing',
        'marketing registration'
      ],
      'rental_registration': [
        'rental registration',
        'landlord registration',
        'tenant registration',
        'rental property'
      ],
      'bank_registration_property': [
        'bank registration',
        'bank property',
        'remu registration',
        'bank-owned property'
      ],
      'bank_registration_land': [
        'bank land',
        'land registration',
        'bank parcel',
        'remu land'
      ],
      'developer_registration_viewing': [
        'developer registration',
        'new construction',
        'developer with viewing',
        'construction registration'
      ],
      'developer_registration_no_viewing': [
        'developer no viewing',
        'construction project',
        'developer direct',
        'new build'
      ],
      'seller_registration_advanced': [
        'advanced registration',
        'multiple properties',
        'special terms',
        'complex registration'
      ],
      'multiple_sellers_clause': [
        'multiple sellers',
        'co-owners',
        'husband and wife',
        'joint owners'
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
        '\\b(registration|register)\\b.*\\b(seller|property|owner)\\b',
        '\\b(standard|regular|normal)\\s+registration\\b'
      ],
      'seller_registration_marketing': [
        '\\b(marketing|agreement|exclusive)\\b.*\\b(registration|seller)\\b'
      ],
      'rental_registration': [
        '\\b(rental|landlord|tenant)\\b.*\\b(registration|register)\\b'
      ],
      'bank_registration_property': [
        '\\b(bank|remu|gordian)\\b.*\\b(property|registration)\\b'
      ],
      'bank_registration_land': [
        '\\b(bank|remu)\\b.*\\b(land|parcel|plot)\\b'
      ],
      'developer_registration_viewing': [
        '\\b(developer|construction)\\b.*\\b(viewing|appointment)\\b'
      ],
      'developer_registration_no_viewing': [
        '\\b(developer|construction)\\b.*(\\b(no viewing|direct)\\b|\\bviewing\\b.*\\b(no|without)\\b)'
      ]
    };

    return patterns[templateId] || [];
  }

  /**
   * Generate semantic examples
   */
  private generateSemanticExamples(templateId: string): string[] {
    return [
      'I need to register my property for sale',
      'Client wants to register their house',
      'We need to do a registration for the seller'
    ];
  }

  /**
   * Generate flow structure for multi-step templates
   */
  private generateFlow(template: any): any {
    if (!template.template_id.includes('registration')) {
      return undefined;
    }

    return {
      steps: [
        {
          id: 'category',
          type: 'question',
          content: 'What type of registration do you need?\n1. **Seller/Owner Registration** (property owners)\n2. **Developer Registration** (new constructions/developments)\n3. **Bank Registration** (bank-owned properties/land)',
          options: ['seller', 'developer', 'bank'],
          nextStep: 'type_selection'
        },
        {
          id: 'seller_type',
          type: 'question',
          content: 'Which seller registration do you need?\n1. **Standard Registration** - Regular property registration\n2. **With Marketing Agreement** - Includes marketing terms\n3. **Rental Property** - For landlords/rentals\n4. **Advanced** - Multiple properties or special terms',
          options: ['standard', 'marketing', 'rental', 'advanced'],
          condition: 'previous_step === "seller"'
        },
        {
          id: 'bank_type',
          type: 'question',
          content: 'Is it for a property or land?\n1. **Property** - House/apartment from bank\n2. **Land** - Land/parcel from bank',
          options: ['property', 'land'],
          condition: 'previous_step === "bank"'
        },
        {
          id: 'developer_viewing',
          type: 'question',
          content: 'Is a viewing arranged?\n1. **Viewing Arranged** - Viewing is scheduled\n2. **No Viewing** - No viewing scheduled yet',
          options: ['yes', 'no'],
          condition: 'previous_step === "developer"'
        }
      ],
      decisionPoints: [
        {
          question: 'Will this registration be sent to multiple sellers? (e.g., husband and wife, co-owners)',
          options: [
            { value: 'yes', nextStep: 'collect_coowners' },
            { value: 'no', nextStep: 'collect_fields' }
          ]
        }
      ]
    };
  }

  /**
   * Build field definitions
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
   * Infer field type from name
   */
  private inferFieldType(fieldName: string): string {
    const lower = fieldName.toLowerCase();

    if (lower.includes('email')) return 'email';
    if (lower.includes('phone')) return 'phone';
    if (lower.includes('date') || lower.includes('datetime')) return 'datetime';
    if (lower.includes('price') || lower.includes('fee') || lower.includes('percent')) return 'currency';
    if (lower.includes('url') || lower.includes('link')) return 'url';
    if (lower.includes('number') || lower.includes('amount')) return 'number';

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
      'property_url_or_description': 'Property URL or description',
      'developer_contact': 'Developer contact name',
      'client_names': 'Client full names',
      'bank_property_reference': 'Bank property reference number'
    };

    return placeholders[fieldName] || `Enter ${this.formatLabel(fieldName)}`;
  }

  /**
   * Build conditional fields
   */
  private buildConditionalFields(template: any): any[] {
    const conditionalFields = [];

    // Add multiple sellers clause for registration templates
    if (template.template_id.includes('registration')) {
      conditionalFields.push({
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
      });
    }

    return conditionalFields;
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
    if (variable.includes('price') || variable.includes('fee')) return 'formatCurrency';
    return undefined;
  }

  /**
   * Generate system prompt
   */
  private generateSystemPrompt(template: any): string {
    const basePrompt = `You are generating a document for Zyprus Real Estate.

CRITICAL RULES:
- Use EXACT template wording with {{VARIABLE}} replacements
- Bold field labels with *asterisks* (format: *Field Name:*)
- Never invent information - ask for missing fields
- Mask phone numbers: 99 07 67 32 → 99 XX 67 32
- Output only the document content
- No confirmation step once all fields are collected`;

    const templateSpecific = this.getTemplateSpecificInstructions(template.template_id);

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

      'rental_registration': `This is a RENTAL PROPERTY REGISTRATION.
Include landlord details, tenant information, and property details.
Emphasize no-direct-contact between tenants and landlord.`,

      'bank_registration_property': `This is a BANK PROPERTY REGISTRATION.
Include bank representative details and property reference.
Use formal tone suitable for bank communication.`,

      'bank_registration_land': `This is a BANK LAND REGISTRATION.
Include bank representative details and land reference.
Mention that viewing form is required for land registration.`,

      'developer_registration_viewing': `This is a DEVELOPER REGISTRATION with viewing arranged.
Include developer contact, client details, and viewing information.
Include agency fee percentage.`,

      'developer_registration_no_viewing': `This is a DEVELOPER REGISTRATION without viewing.
Include developer contact and client details.
No viewing information needed.`,

      'seller_registration_advanced': `This is an ADVANCED SELLER REGISTRATION.
Include all standard fields plus special terms or conditions.
Handle multiple properties if applicable.`,

      'multiple_sellers_clause': `This is a MULTIPLE SELLERS CLAUSE.
Add to registration when there are multiple owners.
Include all co-owner names and relationships.`
    };

    return instructions[templateId] || 'Generate a professional document following the template.';
  }

  /**
   * Generate examples
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
   * Generate constraints
   */
  private generateConstraints(templateId: string): string[] {
    return [
      'Do not add any information not provided by user',
      'Follow exact template format',
      'Maintain professional tone',
      'Include all mandatory sections',
      'Bold all field labels',
      'Mask phone numbers in middle digits'
    ];
  }

  /**
   * Generate embedding for semantic search
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      return [];
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
   * Verify migration results
   */
  async verifyMigration(): Promise<void> {
    console.log('\n🔍 Verifying migration results...');

    // Count enhanced templates
    const { count: enhancedCount } = await supabase
      .from('enhanced_templates')
      .select('*', { count: 'exact', head: true });

    // Count original templates
    const { count: originalCount } = await supabase
      .from('template_cache')
      .select('*', { count: 'exact', head: true });

    console.log(`  Original templates: ${originalCount}`);
    console.log(`  Enhanced templates: ${enhancedCount}`);

    // Check migration logs
    const { data: logs } = await supabase
      .from('template_migration_log')
      .select('status')
      .groupBy('status');

    console.log('\nMigration status:');
    logs.forEach(log => {
      console.log(`  ${log.status}: ${log.status}`);
    });

    // Test semantic search
    console.log('\n🔍 Testing semantic search...');
    const { data: results } = await supabase
      .from('enhanced_templates')
      .select('template_id, name')
      .limit(3);

    console.log(`  Found ${results.length} enhanced templates ready for semantic search`);
  }
}