/**
 * Template Optimizer Service
 *
 * Converts structured text templates to optimized JSON format
 * and manages template caching and performance optimization.
 */

import { readFile } from 'fs/promises';
import { join } from 'path';

export interface OptimizedTemplate {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  content: string;
  variables: TemplateVariable[];
  requiredFields: string[];
  optionalFields: string[];
  subjectLine?: string;
  instructions: string;
  estimatedTokens: number;
  version: string;
  lastUpdated: string;
  metadata: TemplateMetadata;
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'phone' | 'email' | 'url' | 'boolean';
  required: boolean;
  defaultValue?: string;
  validation?: VariableValidation;
  formatting?: VariableFormatting;
}

export interface VariableValidation {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  allowedValues?: string[];
}

export interface VariableFormatting {
  mask?: boolean; // For phone numbers
  bold?: boolean; // For field labels
  dateFormat?: string;
  currency?: boolean;
}

export interface TemplateMetadata {
  usage: number;
  averageResponseTime: number;
  successRate: number;
  lastUsed?: string;
  tags: string[];
  relatedTemplates: string[];
}

export class TemplateOptimizer {
  private templateCache = new Map<string, OptimizedTemplate>();
  private readonly templateBasePath = join(__dirname, '../../project/knowledge/Knowledge Base/StructuredTemplates');

  /**
   * Map category to correct directory name
   */
  private getCategoryDirectory(category: string): string {
    const categoryMap: Record<string, string> = {
      'registration': 'Registrations',
      'email': 'Emails',
      'viewing': 'Viewing',
      'agreement': 'Agreements',
      'social': 'Social'
    };
    return categoryMap[category] || category;
  }

  /**
   * Load and parse a structured template file
   */
  async loadTemplate(templatePath: string, category: string, subcategory: string): Promise<OptimizedTemplate> {
    const cacheKey = `${category}/${subcategory}/${templatePath}`;

    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey)!;
    }

    try {
      const categoryDir = this.getCategoryDirectory(category);
      const fullPath = join(this.templateBasePath, categoryDir, templatePath);
      const content = await readFile(fullPath, 'utf-8');

      const optimized = this.parseTemplate(content, templatePath, category, subcategory);
      this.templateCache.set(cacheKey, optimized);

      return optimized;
    } catch (error) {
      console.error(`Failed to load template ${templatePath}:`, error);
      throw new Error(`Template not found: ${templatePath}`);
    }
  }

  /**
   * Parse template content and extract variables
   */
  private parseTemplate(content: string, templatePath: string, category: string, subcategory: string): OptimizedTemplate {
    const templateId = templatePath.replace('.txt', '');
    const templateName = this.formatTemplateName(templateId);

    // Extract subject line if present
    const subjectMatch = content.match(/^Subject:\s*(.+)$/m);
    const subjectLine = subjectMatch ? subjectMatch[1] : undefined;

    // Extract variables from content
    const variables = this.extractVariables(content);
    const requiredFields = variables
      .filter(v => v.required)
      .map(v => v.name);
    const optionalFields = variables
      .filter(v => !v.required)
      .map(v => v.name);

    // Generate template-specific instructions
    const instructions = this.generateTemplateInstructions(templateId, category, variables);

    return {
      id: templateId,
      name: templateName,
      category,
      subcategory,
      content,
      variables,
      requiredFields,
      optionalFields,
      subjectLine,
      instructions,
      estimatedTokens: this.estimateTokens(content),
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      metadata: {
        usage: 0,
        averageResponseTime: 2000,
        successRate: 0.95,
        tags: this.generateTags(templateId, category),
        relatedTemplates: this.findRelatedTemplates(templateId, category)
      }
    };
  }

  /**
   * Extract variables from template content
   */
  private extractVariables(content: string): TemplateVariable[] {
    const variablePattern = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = variablePattern.exec(content)) !== null) {
      if (match[1]) {
        variables.add(match[1]);
      }
    }

    return Array.from(variables).map(varName => this.createVariable(varName));
  }

  /**
   * Create a variable object with type and validation
   */
  private createVariable(name: string): TemplateVariable {
    const type = this.inferVariableType(name);
    const required = this.isRequiredField(name);
    const validation = this.createValidation(name, type);
    const formatting = this.createFormatting(name, type);

    return {
      name,
      type,
      required,
      validation,
      formatting,
      defaultValue: this.getDefaultValue(name, type)
    };
  }

  /**
   * Infer variable type based on name
   */
  private inferVariableType(name: string): TemplateVariable['type'] {
    const lowerName = name.toLowerCase();

    if (lowerName.includes('phone') || lowerName.includes('mobile')) return 'phone';
    if (lowerName.includes('email')) return 'email';
    if (lowerName.includes('date') || lowerName.includes('time')) return 'date';
    if (lowerName.includes('link') || lowerName.includes('url')) return 'url';
    if (lowerName.includes('price') || lowerName.includes('fee') || lowerName.includes('percent')) return 'number';
    if (lowerName.includes('optional') || lowerName.includes('clause')) return 'boolean';

    return 'text';
  }

  /**
   * Determine if field is required
   */
  private isRequiredField(name: string): boolean {
    const optionalPatterns = [
      /optional/i,
      /clause/i,
      /reminder/i,
      /attachment/i
    ];

    return !optionalPatterns.some(pattern => pattern.test(name));
  }

  /**
   * Create validation rules for variable
   */
  private createValidation(name: string, type: TemplateVariable['type']): VariableValidation | undefined {
    if (type === 'phone') {
      return {
        pattern: '^[+]?[0-9\\s\\-\\(\\)]+$',
        minLength: 10,
        maxLength: 20
      };
    }

    if (type === 'email') {
      return {
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
        maxLength: 255
      };
    }

    if (name.toLowerCase().includes('fee') || name.toLowerCase().includes('percent')) {
      return {
        pattern: '^\\d+(\\.\\d+)?%?$',
        maxLength: 10
      };
    }

    return undefined;
  }

  /**
   * Create formatting rules for variable
   */
  private createFormatting(name: string, type: TemplateVariable['type']): VariableFormatting | undefined {
    const formatting: VariableFormatting = {};

    if (type === 'phone') {
      formatting.mask = true;
    }

    if (name.toLowerCase().includes('label') || name.toLowerCase().includes('information')) {
      formatting.bold = true;
    }

    if (type === 'date') {
      formatting.dateFormat = 'YYYY-MM-DD HH:mm';
    }

    if (name.toLowerCase().includes('price') || name.toLowerCase().includes('fee')) {
      formatting.currency = true;
    }

    return Object.keys(formatting).length > 0 ? formatting : undefined;
  }

  /**
   * Get default value for variable type
   */
  private getDefaultValue(name: string, type: TemplateVariable['type']): string | undefined {
    if (name.toLowerCase().includes('link') && type === 'text') {
      return 'Not provided';
    }

    if (name.toLowerCase().includes('channel') && type === 'text') {
      return 'email';
    }

    return undefined;
  }

  /**
   * Format template name for display
   */
  private formatTemplateName(templateId: string): string {
    return templateId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Generate template-specific instructions
   */
  private generateTemplateInstructions(templateId: string, category: string, variables: TemplateVariable[]): string {
    const requiredVars = variables.filter(v => v.required);
    const optionalVars = variables.filter(v => !requiredVars.includes(v));

    let instructions = `Generate ${templateId.replace(/_/g, ' ')}.\n\n`;

    if (requiredVars.length > 0) {
      instructions += `Required fields: ${requiredVars.map(v => v.name).join(', ')}.\n`;
    }

    if (optionalVars.length > 0) {
      instructions += `Optional fields: ${optionalVars.map(v => v.name).join(', ')}.\n`;
    }

    // Add category-specific instructions
    if (category === 'registrations') {
      instructions += '\nUse professional tone. Include registration confirmation instructions.';
    } else if (category === 'emails') {
      instructions += '\nUse friendly but professional tone. Include clear call-to-action.';
    } else if (category === 'agreements') {
      instructions += '\nUse formal legal tone. Include all necessary legal clauses.';
    }

    return instructions;
  }

  /**
   * Generate tags for template categorization
   */
  private generateTags(templateId: string, category: string): string[] {
    const tags = [category];

    const idLower = templateId.toLowerCase();
    if (idLower.includes('seller')) tags.push('seller');
    if (idLower.includes('buyer') || idLower.includes('client')) tags.push('buyer');
    if (idLower.includes('marketing')) tags.push('marketing');
    if (idLower.includes('viewing')) tags.push('viewing');
    if (idLower.includes('bank')) tags.push('bank');
    if (idLower.includes('developer')) tags.push('developer');
    if (idLower.includes('agreement')) tags.push('agreement');
    if (idLower.includes('email')) tags.push('communication');

    return tags;
  }

  /**
   * Find related templates
   */
  private findRelatedTemplates(templateId: string, _category: string): string[] {
    // Simple related template logic based on naming patterns
    const related: string[] = [];
    const idLower = templateId.toLowerCase();

    if (idLower.includes('seller')) {
      related.push('seller_clause_immediate_relatives', 'seller_clause_no_direct_contact');
    }

    if (idLower.includes('viewing')) {
      related.push('viewing_email_step1', 'viewing_email_step2');
    }

    if (idLower.includes('marketing')) {
      related.push('agreement_marketing_signature', 'agreement_exclusive_selling');
    }

    return related;
  }

  /**
   * Estimate token count for template content
   */
  private estimateTokens(content: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(content.length / 4);
  }

  /**
   * Load multiple templates in parallel
   */
  async loadMultipleTemplates(templateConfigs: Array<{
    path: string;
    category: string;
    subcategory: string;
  }>): Promise<OptimizedTemplate[]> {
    const promises = templateConfigs.map(config =>
      this.loadTemplate(config.path, config.category, config.subcategory)
    );

    return Promise.all(promises);
  }

  /**
   * Get template by ID from cache
   */
  getTemplateFromCache(templateId: string): OptimizedTemplate | undefined {
    for (const template of this.templateCache.values()) {
      if (template.id === templateId) {
        return template;
      }
    }
    return undefined;
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    this.templateCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    categories: Record<string, number>;
    totalTokens: number;
  } {
    const categories: Record<string, number> = {};
    let totalTokens = 0;

    for (const template of this.templateCache.values()) {
      categories[template.category] = (categories[template.category] || 0) + 1;
      totalTokens += template.estimatedTokens;
    }

    return {
      size: this.templateCache.size,
      categories,
      totalTokens
    };
  }

  /**
   * Update template metadata (for analytics)
   */
  updateTemplateMetadata(templateId: string, updates: Partial<TemplateMetadata>): void {
    for (const template of this.templateCache.values()) {
      if (template.id === templateId) {
        template.metadata = {
          ...template.metadata,
          ...updates,
          lastUsed: new Date().toISOString()
        };
        break;
      }
    }
  }
}