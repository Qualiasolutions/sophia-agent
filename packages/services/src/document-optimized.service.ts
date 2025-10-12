/**
 * Optimized Document Generation Service
 *
 * Integrates intent classification, micro-instructions, and intelligent caching
 * to provide fast and efficient document generation.
 */

import { OpenAI } from 'openai';
import { TemplateIntentClassifier, IntentClassification } from './template-intent.service';
import { TemplateInstructionService } from './template-instructions.service';
import { TemplateCacheService } from './template-cache.service';
import { OptimizedTemplate } from './template-optimizer.service';

export interface DocumentGenerationRequest {
  message: string;
  agentId?: string;
  context?: Record<string, any>;
  sessionId?: string;
  preferredTemplate?: string;
}

export interface DocumentGenerationResponse {
  content: string;
  templateId: string;
  templateName: string;
  processingTime: number;
  tokensUsed: number;
  confidence: number;
  metadata: {
    category: string;
    requiredFields: string[];
    optionalFields: string[];
    suggestions: string[];
  };
}

export interface ProcessingMetrics {
  intentClassification: number;
  templateRetrieval: number;
  instructionGeneration: number;
  openaiProcessing: number;
  totalTime: number;
  tokensUsed: number;
}

export class OptimizedDocumentService {
  private openai: OpenAI;
  private intentClassifier: TemplateIntentClassifier;
  private instructionService: TemplateInstructionService;
  private templateCache: TemplateCacheService;

  constructor(
    openaiApiKey: string,
    supabaseUrl: string,
    supabaseServiceKey: string
  ) {
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.intentClassifier = new TemplateIntentClassifier();
    this.instructionService = new TemplateInstructionService();
    this.templateCache = new TemplateCacheService(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Generate document with optimized pipeline
   */
  async generateDocument(request: DocumentGenerationRequest): Promise<DocumentGenerationResponse> {
    const startTime = Date.now();
    const metrics: ProcessingMetrics = {
      intentClassification: 0,
      templateRetrieval: 0,
      instructionGeneration: 0,
      openaiProcessing: 0,
      totalTime: 0,
      tokensUsed: 0
    };

    try {
      // Step 1: Classify intent (fast - milliseconds)
      const classificationStartTime = Date.now();
      const classification = this.intentClassifier.classifyIntent(request.message);
      metrics.intentClassification = Date.now() - classificationStartTime;

      // Smart handling for registration - detect if user provided complete info
      if (classification.category === 'registration' && classification.likelyTemplates.length > 0) {
        // Try to extract fields from the initial message
        const extractedFields = this.extractFieldsFromMessage(request.message);
        const templateId = classification.likelyTemplates[0]!;
        const missingFields = this.getMissingFieldsForTemplate(templateId, extractedFields);

        // If user provided complete information upfront, skip flow and generate directly
        if (missingFields.length === 0 && this.hasMinimumRequiredFields(templateId, extractedFields)) {
          // User provided all info - generate document directly
          console.log('[OptimizedDocumentService] Complete info detected - generating directly');
          // Fall through to normal generation
        } else {
          // Missing fields - start flow with question
          metrics.totalTime = Date.now() - startTime;
          metrics.tokensUsed = 0;

          const response: DocumentGenerationResponse = {
            content: classification.suggestedQuestions[0] || 'What type of registration do you need?',
            templateId: 'registration_flow',
            templateName: 'Registration Flow',
            processingTime: metrics.totalTime,
            tokensUsed: 0,
            confidence: classification.confidence,
            metadata: {
              category: 'registration',
              requiredFields: missingFields,
              optionalFields: [],
              suggestions: classification.suggestedQuestions
            }
          };

          await this.logDocumentGeneration(request, response, metrics);
          return response;
        }
      }

      // Step 2: Get optimized instructions (micro-instructions)
      const instructionStartTime = Date.now();
      const optimizedInstructions = this.instructionService.getOptimizedInstructions(classification);
      metrics.instructionGeneration = Date.now() - instructionStartTime;

      // Step 3: Retrieve relevant templates (with caching)
      const templateStartTime = Date.now();
      const templates = await this.templateCache.getMultipleTemplates(
        classification.likelyTemplates.map(templateId => ({
          templateId,
          category: classification.category
        }))
      );
      metrics.templateRetrieval = Date.now() - templateStartTime;

      // Step 4: Generate document with OpenAI (minimal context)
      const openaiStartTime = Date.now();
      const { content, tokensUsed, selectedTemplate } = await this.generateWithOpenAI(
        request.message,
        optimizedInstructions,
        templates,
        classification
      );
      metrics.openaiProcessing = Date.now() - openaiStartTime;

      metrics.totalTime = Date.now() - startTime;
      metrics.tokensUsed = tokensUsed;

      // Update template metrics
      await this.templateCache.updateTemplateMetrics(
        selectedTemplate.id,
        metrics.totalTime,
        true
      );

      const response: DocumentGenerationResponse = {
        content,
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        processingTime: metrics.totalTime,
        tokensUsed,
        confidence: classification.confidence,
        metadata: {
          category: classification.category,
          requiredFields: classification.requiredFields,
          optionalFields: selectedTemplate.optionalFields,
          suggestions: classification.suggestedQuestions
        }
      };

      // Log generation for analytics
      await this.logDocumentGeneration(request, response, metrics);

      return response;

    } catch (error) {
      console.error('Document generation failed:', error);
      throw new Error(`Document generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate document using OpenAI with minimal context
   */
  private async generateWithOpenAI(
    userMessage: string,
    optimizedInstructions: any,
    templates: OptimizedTemplate[],
    classification: IntentClassification
  ): Promise<{
    content: string;
    tokensUsed: number;
    selectedTemplate: OptimizedTemplate;
  }> {
    // Select the most relevant template
    const selectedTemplate = templates[0] || this.createFallbackTemplate(classification);

    // Build focused prompt with minimal context
    const systemPrompt = this.buildFocusedPrompt(optimizedInstructions, selectedTemplate);

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_tokens: 1500,
        temperature: 0.3,
        top_p: 0.9
      });

      const content = completion.choices[0]?.message?.content || '';
      const tokensUsed = completion.usage?.total_tokens || 0;

      return {
        content: content.trim(),
        tokensUsed,
        selectedTemplate
      };

    } catch (error) {
      console.error('OpenAI generation failed:', error);
      throw new Error(`OpenAI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build focused system prompt with minimal context
   */
  private buildFocusedPrompt(
    optimizedInstructions: any,
    template: OptimizedTemplate
  ): string {
    return `You are Sophia's Document Generation Engine for zyprus.com real estate agents.

${optimizedInstructions.instructions}

TEMPLATE: ${template.name}
${template.content}

REQUIREMENTS:
- Use exact template wording with {{VARIABLE}} replacements
- Never invent information - ask for missing fields
- Bold field labels with *asterisks* (format: *Field Name:*)
- Mask phone numbers: 99 07 67 32 → 99 XX 67 32
- Output only the document content
- No confirmation step once all fields are collected

Focus only on this template. Do not reference other templates.`;
  }

  /**
   * Create fallback template when no template is found
   */
  private createFallbackTemplate(classification: IntentClassification): OptimizedTemplate {
    return {
      id: 'fallback_general',
      name: 'General Document',
      category: classification.category,
      subcategory: 'general',
      content: `Dear {{CLIENT_NAME}},

This is a general document template for your request.

{{CUSTOM_CONTENT}}

Best regards,
{{AGENT_NAME}}`,
      variables: [
        { name: 'CLIENT_NAME', type: 'text', required: true },
        { name: 'CUSTOM_CONTENT', type: 'text', required: true },
        { name: 'AGENT_NAME', type: 'text', required: false }
      ],
      requiredFields: ['CLIENT_NAME', 'CUSTOM_CONTENT'],
      optionalFields: ['AGENT_NAME'],
      instructions: 'Generate a general document with basic information.',
      estimatedTokens: 100,
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      metadata: {
        usage: 0,
        averageResponseTime: 3000,
        successRate: 0.8,
        tags: ['fallback', 'general'],
        relatedTemplates: []
      }
    };
  }

  /**
   * Get template suggestions for user
   */
  async getTemplateSuggestions(message: string): Promise<OptimizedTemplate[]> {
    return await this.templateCache.getTemplateSuggestions(message);
  }

  /**
   * Quick intent classification without document generation
   */
  classifyIntent(message: string): IntentClassification {
    return this.intentClassifier.classifyIntent(message);
  }

  /**
   * Generate multiple documents efficiently
   */
  async generateMultipleDocuments(
    requests: DocumentGenerationRequest[]
  ): Promise<DocumentGenerationResponse[]> {
    // Process in parallel with concurrency control
    const concurrency = 3; // Limit concurrent OpenAI requests
    const results: DocumentGenerationResponse[] = [];

    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      const batchPromises = batch.map(request => this.generateDocument(request));
      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Batch request ${i + index} failed:`, result.reason);
        }
      });
    }

    return results;
  }

  /**
   * Validate template variables
   */
  validateTemplateVariables(
    _templateId: string,
    _variables: Record<string, any>
  ): {
    isValid: boolean;
    missingFields: string[];
    invalidFields: Array<{ field: string; error: string }>;
  } {
    // This would need to be implemented in the template cache service
    // For now, return a basic validation
    return {
      isValid: true,
      missingFields: [],
      invalidFields: []
    };
  }

  /**
   * Get performance metrics
   */
  getMetrics(): {
    service: {
      totalGenerations: number;
      averageResponseTime: number;
      successRate: number;
      popularTemplates: Array<{
        templateId: string;
        usage: number;
        averageTime: number;
      }>;
    };
    cache: any;
    intent: any;
  } {
    const cacheMetrics = this.templateCache.getMetrics();
    const intentMetrics = this.intentClassifier.getMetrics();

    return {
      service: {
        totalGenerations: cacheMetrics.totalRequests,
        averageResponseTime: cacheMetrics.averageResponseTime,
        successRate: 0.95, // This would be calculated from actual data
        popularTemplates: cacheMetrics.popularTemplates
      },
      cache: cacheMetrics,
      intent: intentMetrics
    };
  }

  /**
   * Log document generation for analytics
   */
  private async logDocumentGeneration(
    _request: DocumentGenerationRequest,
    response: DocumentGenerationResponse,
    _metrics: ProcessingMetrics
  ): Promise<void> {
    try {
      // This would log to Supabase - for now, just log to console
      console.log('Document generation logged:', {
        template: response.templateName,
        time: response.processingTime,
        tokens: response.tokensUsed
      });

    } catch (error) {
      console.warn('Failed to log document generation:', error);
    }
  }

  /**
   * Warm up the service with common templates
   */
  async warmUp(): Promise<void> {
    try {
      await this.templateCache.preloadPopularTemplates();
      console.log('Document generation service warmed up successfully');
    } catch (error) {
      console.error('Service warm-up failed:', error);
    }
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: {
      intentClassifier: boolean;
      templateCache: boolean;
      openaiConnection: boolean;
    };
    metrics: any;
  }> {
    const checks = {
      intentClassifier: true,
      templateCache: true,
      openaiConnection: false
    };

    try {
      // Test OpenAI connection
      await this.openai.models.list();
      checks.openaiConnection = true;
    } catch (error) {
      console.error('OpenAI health check failed:', error);
    }

    const allHealthy = Object.values(checks).every(check => check);
    const status = allHealthy ? 'healthy' : checks.openaiConnection ? 'degraded' : 'unhealthy';

    return {
      status,
      checks,
      metrics: this.getMetrics()
    };
  }

  /**
   * Extract fields from user message using pattern matching
   */
  private extractFieldsFromMessage(message: string): Record<string, string> {
    const fields: Record<string, string> = {};

    // Extract seller/landlord/owner name
    const sellerMatch = message.match(/(?:seller|landlord|owner|from)\s+(?:is\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
    if (sellerMatch && sellerMatch[1]) fields.seller_name = sellerMatch[1].trim();

    // Extract buyer/tenant/client name
    const buyerMatch = message.match(/(?:buyer|tenant|client|to)\s+(?:is\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+(?:\s*&\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)?)*)/i);
    if (buyerMatch && buyerMatch[1]) fields.buyer_names = buyerMatch[1].trim();

    // Extract property description with Reg No
    const regNoMatch = message.match(/(?:reg\s*(?:no|number)?[.\s:]*|registration\s+no[.\s:]*)\s*([0-9/]+(?:\s*[,\s]\s*[A-Za-z\s,]+)?)/i);
    if (regNoMatch && regNoMatch[1]) fields.property_description = regNoMatch[1].trim();

    // Extract viewing date and time
    const viewingMatch = message.match(/(?:viewing|view)\s+(?:on\s+|for\s+)?([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s+\d{4}\s+at\s+\d{1,2}:\d{2}\s*(?:am|pm)?)/i);
    if (viewingMatch && viewingMatch[1]) fields.viewing_datetime = viewingMatch[1].trim();

    // Extract agency fee
    const feeMatch = message.match(/(?:fee|fees)\s+(\d+%\s*\+?\s*VAT)/i);
    if (feeMatch && feeMatch[1]) fields.agency_fee = feeMatch[1].trim();

    // Extract property link
    const linkMatch = message.match(/(https?:\/\/[^\s]+)/i);
    if (linkMatch && linkMatch[1]) fields.property_link = linkMatch[1].trim();

    // Extract phone numbers
    const phoneMatch = message.match(/(\+?\d{2,3}\s*\d{2}\s*\d{2}\s*\d{2}\s*\d{2})/);
    if (phoneMatch && phoneMatch[1]) fields.client_phone = phoneMatch[1].trim();

    return fields;
  }

  /**
   * Get missing fields for a specific template
   */
  private getMissingFieldsForTemplate(templateId: string, extractedFields: Record<string, string>): string[] {
    const requiredFieldsByTemplate: Record<string, string[]> = {
      'seller_registration_standard': ['seller_name', 'buyer_names', 'property_description', 'viewing_datetime'],
      'seller_registration_marketing': ['seller_name', 'buyer_names', 'property_description', 'viewing_datetime', 'agency_fee'],
      'rental_registration': ['seller_name', 'buyer_names', 'property_description', 'viewing_datetime'],
      'seller_registration_advanced': ['seller_name', 'buyer_names', 'property_description', 'agency_fee'],
      'bank_registration_property': ['client_name', 'client_phone', 'property_link'],
      'bank_registration_land': ['client_name', 'client_phone', 'property_link'],
      'developer_registration_viewing': ['client_name', 'viewing_datetime', 'agency_fee'],
      'developer_registration_no_viewing': ['client_name', 'agency_fee']
    };

    const requiredFields = requiredFieldsByTemplate[templateId] || [];
    return requiredFields.filter(field => !extractedFields[field]);
  }

  /**
   * Check if user provided minimum required fields for direct generation
   */
  private hasMinimumRequiredFields(templateId: string, extractedFields: Record<string, string>): boolean {
    const missingFields = this.getMissingFieldsForTemplate(templateId, extractedFields);
    return missingFields.length === 0;
  }
}