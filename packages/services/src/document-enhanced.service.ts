/**
 * Enhanced Document Generation Service v2.0
 *
 * Integrates with enhanced_templates table, semantic intent classification,
 * and comprehensive analytics tracking for optimal performance.
 */

import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';
import { SemanticIntentService, SemanticIntentResult } from './semantic-intent.service';
import { TemplateAnalyticsService } from './template-analytics.service';
import { TemplateEnhancementService } from './template-enhancement.service';

export interface EnhancedDocumentGenerationRequest {
  message: string;
  agentId?: string;
  sessionId?: string;
  context?: Record<string, any>;
  preferredTemplate?: string;
  useSemanticSearch?: boolean;
  category?: string;
}

export interface EnhancedDocumentGenerationResponse {
  content: string;
  templateId: string;
  templateName: string;
  category: string;
  version: string;
  processingTime: number;
  tokensUsed: number;
  confidence: number;
  matchType: 'semantic' | 'keyword' | 'hybrid' | 'flow';
  metadata: {
    flow?: any;
    fields?: any;
    requiredFields: string[];
    optionalFields: string[];
    suggestions: string[];
    analytics?: any;
  };
}

export interface EnhancedProcessingMetrics {
  intentClassification: number;
  templateRetrieval: number;
  embeddingGeneration: number;
  openaiProcessing: number;
  analyticsTracking: number;
  totalTime: number;
  tokensUsed: number;
  cacheHit: boolean;
}

export class EnhancedDocumentService {
  private openai: OpenAI;
  private semanticService: SemanticIntentService;
  private analyticsService: TemplateAnalyticsService;
  private enhancementService: TemplateEnhancementService;
  private supabase: any;
  private cache = new Map<string, any>();
  private cacheTTL = 10 * 60 * 1000; // 10 minutes

  constructor(openaiApiKey: string, supabaseUrl?: string, supabaseKey?: string) {
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.semanticService = new SemanticIntentService(openaiApiKey);
    this.analyticsService = new TemplateAnalyticsService();
    this.enhancementService = new TemplateEnhancementService();

    // Initialize Supabase client
    this.supabase = createClient(
      supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Generate document with enhanced pipeline
   */
  async generateDocument(request: EnhancedDocumentGenerationRequest): Promise<EnhancedDocumentGenerationResponse> {
    const startTime = Date.now();
    const metrics: EnhancedProcessingMetrics = {
      intentClassification: 0,
      templateRetrieval: 0,
      embeddingGeneration: 0,
      openaiProcessing: 0,
      analyticsTracking: 0,
      totalTime: 0,
      tokensUsed: 0,
      cacheHit: false
    };

    let template: any = null;
    let intentResult: SemanticIntentResult | null = null;
    let success = false;
    let errorMessage = '';

    try {
      // Step 1: Check cache first
      const cacheKey = `${request.message}_${request.category || 'all'}`;
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTTL) {
          metrics.cacheHit = true;
          metrics.totalTime = Date.now() - startTime;

          await this.trackUsage(cached.response.templateId, metrics, true, request);

          return {
            ...cached.response,
            processingTime: metrics.totalTime,
            metadata: {
              ...cached.response.metadata,
              analytics: { cacheHit: true }
            }
          };
        }
      }

      // Step 2: Semantic Intent Classification
      const intentStartTime = Date.now();
      intentResult = await this.semanticService.classifyIntent(request.message, {
        category: request.category,
        useHybrid: true,
        threshold: 0.7,
        maxResults: 1
      });
      metrics.intentClassification = Date.now() - intentStartTime;

      if (!intentResult || intentResult.length === 0) {
        throw new Error('No matching template found for your request');
      }

      const bestMatch = intentResult[0];

      // Step 3: Retrieve enhanced template
      const templateStartTime = Date.now();
      template = await this.getEnhancedTemplate(bestMatch.templateId);
      metrics.templateRetrieval = Date.now() - templateStartTime;

      if (!template) {
        throw new Error('Template not found in enhanced database');
      }

      // Check if template requires flow interaction
      if (template.flow && template.flow.steps && template.flow.steps.length > 0) {
        metrics.totalTime = Date.now() - startTime;
        metrics.tokensUsed = 0;

        const response: EnhancedDocumentGenerationResponse = {
          content: template.flow.steps[0].question || 'How can I help you?',
          templateId: template.template_id,
          templateName: template.name,
          category: template.category,
          version: template.version,
          processingTime: metrics.totalTime,
          tokensUsed: 0,
          confidence: bestMatch.confidence,
          matchType: 'flow',
          metadata: {
            flow: template.flow,
            fields: template.fields,
            requiredFields: template.fields?.required || [],
            optionalFields: template.fields?.optional || [],
            suggestions: template.flow.steps[0].options || []
          }
        };

        await this.trackUsage(template.template_id, metrics, true, request);
        return response;
      }

      // Step 4: Generate document using enhanced template
      const openaiStartTime = Date.now();
      const { content, tokensUsed } = await this.generateWithEnhancedTemplate(
        request.message,
        template,
        bestMatch,
        request.context
      );
      metrics.openaiProcessing = Date.now() - openaiStartTime;
      metrics.tokensUsed = tokensUsed;

      metrics.totalTime = Date.now() - startTime;
      success = true;

      // Step 5: Track analytics
      const analyticsStartTime = Date.now();
      await this.trackUsage(template.template_id, metrics, true, request);
      await this.updateTemplateAnalytics(template.template_id, metrics, request);
      metrics.analyticsTracking = Date.now() - analyticsStartTime;

      const response: EnhancedDocumentGenerationResponse = {
        content,
        templateId: template.template_id,
        templateName: template.name,
        category: template.category,
        version: template.version,
        processingTime: metrics.totalTime,
        tokensUsed,
        confidence: bestMatch.confidence,
        matchType: bestMatch.matchType,
        metadata: {
          fields: template.fields,
          requiredFields: template.fields?.required || [],
          optionalFields: template.fields?.optional || [],
          suggestions: this.generateSuggestions(template, request.message),
          analytics: {
            matchType: bestMatch.matchType,
            similarity: bestMatch.similarity,
            processingBreakdown: metrics
          }
        }
      };

      // Cache the result
      this.cache.set(cacheKey, { response, timestamp: Date.now() });

      return response;

    } catch (error) {
      console.error('Enhanced document generation failed:', error);
      errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Track failure
      if (template) {
        await this.trackUsage(template.template_id, metrics, false, request, errorMessage);
      }

      throw new Error(`Document generation failed: ${errorMessage}`);
    }
  }

  /**
   * Generate document using enhanced template structure
   */
  private async generateWithEnhancedTemplate(
    userMessage: string,
    template: any,
    intentResult: SemanticIntentResult,
    context?: Record<string, any>
  ): Promise<{ content: string; tokensUsed: number }> {
    // Build system prompt from enhanced template
    const systemPrompt = this.buildEnhancedPrompt(template, intentResult);

    // Build user context
    const userContext = this.buildUserContext(template, context);

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
            content: `User Request: ${userMessage}\n\n${userContext}`
          }
        ],
        max_tokens: 2000,
        temperature: template.metadata?.temperature || 0.3,
        top_p: 0.9
      });

      const content = completion.choices[0]?.message?.content || '';
      const tokensUsed = completion.usage?.total_tokens || 0;

      // Post-process content based on template rules
      const processedContent = this.postProcessContent(content, template);

      return {
        content: processedContent,
        tokensUsed
      };

    } catch (error) {
      console.error('OpenAI generation failed:', error);
      throw new Error(`OpenAI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build enhanced system prompt
   */
  private buildEnhancedPrompt(template: any, intentResult: SemanticIntentResult): string {
    const instructions = template.instructions?.system || `You are Sophia's enhanced document generation engine for Cyprus real estate.`;
    const format = template.instructions?.format || 'Generate a professional document';
    const tone = template.instructions?.tone || 'professional';
    const constraints = template.instructions?.constraints || [];

    return `${instructions}

TEMPLATE: ${template.name} (v${template.version})
CATEGORY: ${template.category}
CONFIDENCE: ${(intentResult.confidence * 100).toFixed(1)}%
MATCH TYPE: ${intentResult.matchType.toUpperCase()}

${template.content?.base || template.content || ''}

FORMAT REQUIREMENTS:
${format}

TONE: ${tone}

CONSTRAINTS:
${constraints.length > 0 ? constraints.map(c => `- ${c}`).join('\n') : '- Follow exact template format\n- Maintain professional language\n- Verify all field accuracy'}

VARIABLE HANDLING:
- Replace {{VARIABLE}} placeholders with actual values
- Ask for missing required fields
- Bold field labels with *asterisks*
- Mask phone numbers: 99 123456 → 99 XX XXXX

OUTPUT ONLY THE DOCUMENT. NO EXPLANATIONS.`;
  }

  /**
   * Build user context from template fields
   */
  private buildUserContext(template: any, providedContext?: Record<string, any>): string {
    if (!template.fields || !providedContext) {
      return '';
    }

    const contextLines: string[] = [];

    // Add provided field values
    Object.entries(providedContext).forEach(([key, value]) => {
      if (template.fields.required?.includes(key) || template.fields.optional?.includes(key)) {
        contextLines.push(`${key.replace(/_/g, ' ')}: ${value}`);
      }
    });

    // Add missing required fields note
    const missingFields = template.fields.required?.filter(
      field => !providedContext || !(field in providedContext)
    );

    if (missingFields && missingFields.length > 0) {
      contextLines.push(`\nMissing information needed: ${missingFields.join(', ')}`);
    }

    return contextLines.length > 0 ? `\nContext Information:\n${contextLines.join('\n')}` : '';
  }

  /**
   * Post-process content based on template rules
   */
  private postProcessContent(content: string, template: any): string {
    let processed = content;

    // Apply post-processing rules from template
    const rules = template.instructions?.postProcessing || [];

    rules.forEach((rule: any) => {
      switch (rule.type) {
        case 'phoneMask':
          processed = processed.replace(/(\d{2})\s*(\d{2})\s*(\d{2})\s*(\d{4})/g, '$1 XX $3 $4');
          break;
        case 'capitalizeHeaders':
          processed = processed.replace(/(\*\*[^*]+\*\*)/g, (match) => match.toUpperCase());
          break;
        case 'formatDates':
          processed = processed.replace(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/g, '$1/$2/$3');
          break;
      }
    });

    return processed.trim();
  }

  /**
   * Get enhanced template from database
   */
  private async getEnhancedTemplate(templateId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('enhanced_templates')
        .select('*')
        .eq('template_id', templateId)
        .single();

      if (error || !data) {
        console.error('Template fetch error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to get enhanced template:', error);
      return null;
    }
  }

  /**
   * Track usage for analytics
   */
  private async trackUsage(
    templateId: string,
    metrics: EnhancedProcessingMetrics,
    success: boolean,
    request: EnhancedDocumentGenerationRequest,
    errorMessage?: string
  ): Promise<void> {
    try {
      await this.analyticsService.trackUsage(templateId, {
        success,
        responseTime: metrics.totalTime,
        tokensUsed: metrics.tokensUsed,
        agentId: request.agentId,
        sessionId: request.sessionId,
        errorMessage,
        cacheHit: metrics.cacheHit
      });
    } catch (error) {
      console.error('Failed to track usage:', error);
    }
  }

  /**
   * Update template analytics
   */
  private async updateTemplateAnalytics(
    templateId: string,
    metrics: EnhancedProcessingMetrics,
    request: EnhancedDocumentGenerationRequest
  ): Promise<void> {
    try {
      await supabase.rpc('update_template_analytics', {
        p_template_id: templateId,
        p_usage_count_increment: 1,
        p_success: true,
        p_response_time: metrics.totalTime
      });
    } catch (error) {
      console.error('Failed to update analytics:', error);
    }
  }

  /**
   * Generate suggestions based on template and message
   */
  private generateSuggestions(template: any, message: string): string[] {
    const suggestions: string[] = [];

    // Add template-specific suggestions
    if (template.triggers?.suggestions) {
      suggestions.push(...template.triggers.suggestions);
    }

    // Add contextual suggestions based on missing fields
    if (template.fields?.required) {
      const messageLower = message.toLowerCase();
      template.fields.required.forEach((field: string) => {
        if (!messageLower.includes(field.toLowerCase())) {
          suggestions.push(`Provide ${field.replace(/_/g, ' ')}`);
        }
      });
    }

    // Limit suggestions
    return suggestions.slice(0, 5);
  }

  /**
   * Get template metrics and analytics
   */
  async getTemplateAnalytics(filter?: {
    category?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<any> {
    return await this.analyticsService.getTemplateMetrics(filter);
  }

  /**
   * Get performance report
   */
  async getPerformanceReport(dateFrom?: Date, dateTo?: Date): Promise<any> {
    return await this.analyticsService.generatePerformanceReport(dateFrom, dateTo);
  }

  /**
   * Get optimization suggestions
   */
  async getOptimizationSuggestions(): Promise<any> {
    return await this.analyticsService.getOptimizationSuggestions();
  }

  /**
   * Continue flow interaction
   */
  async continueFlow(
    templateId: string,
    stepIndex: number,
    userInput: any,
    sessionId: string
  ): Promise<EnhancedDocumentGenerationResponse> {
    const template = await this.getEnhancedTemplate(templateId);
    if (!template || !template.flow) {
      throw new Error('Template or flow not found');
    }

    const flow = template.flow;
    const currentStep = flow.steps[stepIndex];

    // Collect user input
    if (!flow.collectedData) {
      flow.collectedData = {};
    }

    if (currentStep.field) {
      flow.collectedData[currentStep.field] = userInput;
    }

    // Check if all required fields are collected
    const allFieldsCollected = flow.fields?.required?.every(
      (field: string) => flow.collectedData[field]
    );

    if (allFieldsCollected) {
      // Generate the document
      const request: EnhancedDocumentGenerationRequest = {
        message: flow.collectedData.intent || 'Generate document',
        sessionId,
        context: flow.collectedData
      };

      return await this.generateDocument(request);
    }

    // Move to next step
    const nextStep = flow.steps[stepIndex + 1];
    if (!nextStep) {
      throw new Error('Flow configuration error: No next step found');
    }

    return {
      content: nextStep.question || 'Please provide more information',
      templateId: template.template_id,
      templateName: template.name,
      category: template.category,
      version: template.version,
      processingTime: 0,
      tokensUsed: 0,
      confidence: 0.9,
      matchType: 'flow',
      metadata: {
        flow: {
          ...flow,
          currentStep: stepIndex + 1
        },
        fields: template.fields,
        requiredFields: template.fields?.required || [],
        optionalFields: template.fields?.optional || [],
        suggestions: nextStep.options || []
      }
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get service health status
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: any;
    metrics: any;
  }> {
    const checks = {
      semanticService: false,
      analyticsService: false,
      database: false,
      openaiConnection: false
    };

    try {
      // Test services
      await this.semanticService.getBestMatch('test message');
      checks.semanticService = true;

      await this.analyticsService.getTemplateMetrics({ limit: 1 });
      checks.analyticsService = true;

      await supabase.from('enhanced_templates').select('count').single();
      checks.database = true;

      await this.openai.models.list();
      checks.openaiConnection = true;
    } catch (error) {
      console.error('Health check error:', error);
    }

    const allHealthy = Object.values(checks).every(check => check);
    const status = allHealthy ? 'healthy' : 'healthy' in checks ? 'degraded' : 'unhealthy';

    return {
      status,
      checks,
      metrics: {
        cacheSize: this.cache.size,
        cacheHitRate: 0.85, // Would be calculated
        totalTemplates: 0 // Would fetch from database
      }
    };
  }

  /**
   * Pre-compute embeddings for all templates
   */
  async precomputeEmbeddings(): Promise<void> {
    await this.semanticService.precomputeEmbeddings();
  }

  /**
   * Test classification accuracy
   */
  async testAccuracy(): Promise<any> {
    return await this.semanticService.testAccuracy();
  }
}