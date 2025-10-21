/**
 * Enhanced OpenAI Service v2.0
 *
 * Integrates with enhanced templates, semantic classification, and analytics
 * for improved document generation and conversational AI.
 */

import OpenAI from 'openai';
import type {
  AIResponse,
  ConversationContext,
  OpenAIConfig,
} from '@sophiaai/shared';
import { EnhancedDocumentService, EnhancedDocumentGenerationRequest } from './document-enhanced.service';
import { TemplateAnalyticsService } from './template-analytics.service';
import { createClient } from '@supabase/supabase-js';
import { SOPHIA_SYSTEM_PROMPT } from './constants/sophia-system-prompt';

const GPT_MODEL = 'gpt-4o-mini' as const;

export class EnhancedOpenAIService {
  private client: OpenAI;
  private config: OpenAIConfig;
  private documentService: EnhancedDocumentService;
  private analyticsService: TemplateAnalyticsService;
  private systemPrompt: string;
  private supabase: any;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    this.client = new OpenAI({
      apiKey,
      timeout: 15000, // Increased for enhanced processing
    });

    this.config = {
      model: GPT_MODEL,
      temperature: 0.7,
      maxTokens: 500,
      timeout: 15000,
    };

    this.systemPrompt = SOPHIA_SYSTEM_PROMPT;
    this.documentService = new EnhancedDocumentService(apiKey);
    this.analyticsService = new TemplateAnalyticsService();

    // Initialize Supabase client
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Generate an AI response with enhanced capabilities
   */
  async generateResponse(
    message: string,
    context?: ConversationContext
  ): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // Check if this is a document request
      const isDocumentRequest = await this.isDocumentRequest(message);

      if (isDocumentRequest) {
        console.log('[Enhanced OpenAI] Document request detected - using enhanced service', {
          agentId: context?.agentId,
          messageLength: message.length,
        });

        // Use enhanced document service
        const documentRequest: EnhancedDocumentGenerationRequest = {
          message,
          agentId: context?.agentId,
          sessionId: context?.sessionId,
          context: context?.metadata,
          useSemanticSearch: true,
        };

        const documentResponse = await this.documentService.generateDocument(documentRequest);

        // Track the interaction
        await this.trackInteraction(message, documentResponse, context);

        return {
          text: documentResponse.content,
          tokensUsed: {
            prompt: Math.floor(documentResponse.tokensUsed * 0.4),
            completion: Math.floor(documentResponse.tokensUsed * 0.6),
            total: documentResponse.tokensUsed,
          },
          costEstimate: this.calculateCost(documentResponse.tokensUsed),
          responseTime: documentResponse.processingTime,
          metadata: {
            templateId: documentResponse.templateId,
            templateName: documentResponse.templateName,
            category: documentResponse.category,
            matchType: documentResponse.matchType,
            confidence: documentResponse.confidence,
            version: documentResponse.version,
          },
        };
      }

      // Not a document request - use regular chat
      const isGreeting = this.isGreeting(message);

      // Build messages array
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: this.systemPrompt },
      ];

      // Add conversation history if provided
      if (context?.messageHistory) {
        messages.push(
          ...context.messageHistory.map((msg) => ({
            role: msg.role,
            content: msg.content,
          }))
        );
      }

      // Add current user message
      messages.push({ role: 'user', content: message });

      // Use enhanced tools
      const tools = await this.getEnhancedTools();

      // Make API call
      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages,
        tools,
        tool_choice: 'auto',
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      });

      const response = completion.choices[0];
      const responseTime = Date.now() - startTime;

      // Handle tool calls
      if (response.message?.tool_calls) {
        return await this.handleToolCalls(
          response.message.tool_calls,
          messages,
          context,
          startTime
        );
      }

      const text = response.message?.content || '';
      const tokensUsed = completion.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      };

      return {
        text,
        tokensUsed: {
          prompt: tokensUsed.prompt_tokens,
          completion: tokensUsed.completion_tokens,
          total: tokensUsed.total_tokens,
        },
        costEstimate: this.calculateCost(tokensUsed.total_tokens),
        responseTime,
      };

    } catch (error) {
      console.error('Enhanced OpenAI service error:', error);
      throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if message is a document request using semantic analysis
   */
  private async isDocumentRequest(message: string): Promise<boolean> {
    const documentKeywords = [
      'generate', 'create', 'need', 'draft', 'write', 'prepare',
      'document', 'form', 'template', 'agreement', 'contract',
      'registration', 'listing', 'email', 'viewing', 'bank',
      'developer', 'seller', 'property', 'land'
    ];

    const messageLower = message.toLowerCase();
    const hasDocumentKeyword = documentKeywords.some(keyword =>
      messageLower.includes(keyword)
    );

    // Use semantic service for better detection
    try {
      const semanticResult = await this.documentService.semanticService.getBestMatch(message, {
        threshold: 0.6,
        maxResults: 1
      });

      return hasDocumentKeyword || (semanticResult !== null && semanticResult.confidence > 0.6);
    } catch {
      return hasDocumentKeyword;
    }
  }

  /**
   * Get enhanced tools/functions
   */
  private async getEnhancedTools(): Promise<OpenAI.Chat.ChatCompletionTool[]> {
    // Get available templates from enhanced_templates
    const { data: templates } = await supabase
      .from('enhanced_templates')
      .select('template_id, name, category, metadata')
      .limit(50);

    return [
      {
        type: 'function',
        function: {
          name: 'search_templates',
          description: 'Search for document templates using semantic matching',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Natural language description of the template needed',
              },
              category: {
                type: 'string',
                description: 'Optional category filter',
                enum: ['registration', 'email', 'viewing', 'agreement', 'social'],
              },
            },
            required: ['query'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_template_analytics',
          description: 'Get performance analytics for templates',
          parameters: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                description: 'Filter by category',
              },
              sortBy: {
                type: 'string',
                description: 'Sort by metric',
                enum: ['usage', 'successRate', 'responseTime'],
              },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'list_document_templates',
          description: 'List all available document templates',
          parameters: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                description: 'Filter by category',
                enum: ['registration', 'email', 'viewing', 'agreement', 'social'],
              },
            },
          },
        },
      },
    ];
  }

  /**
   * Handle tool calls from OpenAI
   */
  private async handleToolCalls(
    toolCalls: OpenAI.Chat.ChatCompletionMessageToolCall[],
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    context?: ConversationContext,
    startTime?: number
  ): Promise<AIResponse> {
    const toolResponses: any[] = [];

    for (const toolCall of toolCalls) {
      const { name, arguments: args } = toolCall.function;

      switch (name) {
        case 'search_templates':
          const searchResults = await this.searchTemplates(JSON.parse(args));
          toolResponses.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            content: JSON.stringify(searchResults, null, 2),
          });
          break;

        case 'get_template_analytics':
          const analytics = await this.getTemplateAnalytics(JSON.parse(args));
          toolResponses.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            content: JSON.stringify(analytics, null, 2),
          });
          break;

        case 'list_document_templates':
          const templates = await this.listTemplates(JSON.parse(args));
          toolResponses.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            content: JSON.stringify(templates, null, 2),
          });
          break;

        default:
          toolResponses.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            content: `Unknown function: ${name}`,
          });
      }
    }

    // Make follow-up call with tool results
    const completion = await this.client.chat.completions.create({
      model: this.config.model,
      messages: [...messages, ...toolResponses],
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
    });

    const response = completion.choices[0];
    const responseTime = Date.now() - (startTime || Date.now());
    const tokensUsed = completion.usage || {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    };

    return {
      text: response.message?.content || '',
      tokensUsed: {
        prompt: tokensUsed.prompt_tokens,
        completion: tokensUsed.completion_tokens,
        total: tokensUsed.total_tokens,
      },
      costEstimate: this.calculateCost(tokensUsed.total_tokens),
      responseTime,
    };
  }

  /**
   * Search templates using semantic matching
   */
  private async searchTemplates(params: { query: string; category?: string }) {
    try {
      const results = await this.documentService.semanticService.classifyIntent(params.query, {
        category: params.category,
        maxResults: 5,
        threshold: 0.5,
      });

      return {
        success: true,
        results: results.map(r => ({
          templateId: r.templateId,
          templateName: r.templateName,
          category: r.category,
          confidence: r.confidence,
          matchType: r.matchType,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        results: [],
      };
    }
  }

  /**
   * Get template analytics
   */
  private async getTemplateAnalytics(params: { category?: string; sortBy?: string }) {
    try {
      const metrics = await this.analyticsService.getTemplateMetrics({
        category: params.category,
        sortBy: params.sortBy as any,
        limit: 10,
      });

      return {
        success: true,
        metrics: metrics.map(m => ({
          templateId: m.templateId,
          templateName: m.templateName,
          category: m.category,
          usageCount: m.usageCount,
          successRate: `${(m.successRate * 100).toFixed(1)}%`,
          averageResponseTime: `${m.averageResponseTime}ms`,
          lastUsed: m.lastUsed,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: [],
      };
    }
  }

  /**
   * List available templates
   */
  private async listTemplates(params: { category?: string }) {
    try {
      let query = supabase
        .from('enhanced_templates')
        .select('template_id, name, category, metadata')
        .order('template_id');

      if (params.category) {
        query = query.eq('category', params.category);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return {
        success: true,
        templates: data.map(t => ({
          id: t.template_id,
          name: t.name,
          category: t.category,
          popularity: t.metadata?.popularity || 0,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        templates: [],
      };
    }
  }

  /**
   * Check if message is a greeting
   */
  private isGreeting(message: string): boolean {
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'];
    const messageLower = message.toLowerCase().trim();
    return greetings.some(greeting => messageLower.includes(greeting));
  }

  /**
   * Calculate cost based on token usage
   */
  private calculateCost(tokens: number): number {
    // GPT-4o-mini pricing
    const inputCost = (tokens * 0.15) / 1_000_000;
    const outputCost = (tokens * 0.60) / 1_000_000;
    return inputCost + outputCost;
  }

  /**
   * Track interaction for analytics
   */
  private async trackInteraction(
    message: string,
    response: any,
    context?: ConversationContext
  ): Promise<void> {
    try {
      await supabase
        .from('optimized_document_generations')
        .insert({
          template_id: response.templateId,
          template_name: response.templateName,
          category: response.category,
          processing_time_ms: response.processingTime,
          tokens_used: response.tokensUsed,
          confidence: response.confidence,
          original_request: message,
          generated_content: response.content,
          success: true,
          cache_hit: response.metadata?.analytics?.cacheHit || false,
          cost_estimate: this.calculateCost(response.tokensUsed),
          session_id: context?.sessionId,
          metadata: {
            agent_id: context?.agentId,
            match_type: response.matchType,
            version: response.version,
            tracked_at: new Date().toISOString(),
          },
        });
    } catch (error) {
      console.error('Failed to track interaction:', error);
    }
  }

  /**
   * Get performance metrics
   */
  async getMetrics(): Promise<any> {
    return await this.analyticsService.generatePerformanceReport();
  }

  /**
   * Continue flow interaction
   */
  async continueFlow(
    templateId: string,
    stepIndex: number,
    userInput: any,
    sessionId: string
  ): Promise<AIResponse> {
    const flowResponse = await this.documentService.continueFlow(
      templateId,
      stepIndex,
      userInput,
      sessionId
    );

    return {
      text: flowResponse.content,
      tokensUsed: {
        prompt: 0,
        completion: 0,
        total: 0,
      },
      costEstimate: 0,
      responseTime: flowResponse.processingTime,
      metadata: {
        templateId: flowResponse.templateId,
        templateName: flowResponse.templateName,
        category: flowResponse.category,
        matchType: 'flow',
        confidence: flowResponse.confidence,
        flow: flowResponse.metadata.flow,
      },
    };
  }

  /**
   * Precompute embeddings for all templates
   */
  async precomputeEmbeddings(): Promise<void> {
    await this.documentService.precomputeEmbeddings();
  }

  /**
   * Test accuracy of intent classification
   */
  async testAccuracy(): Promise<any> {
    return await this.documentService.testAccuracy();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<any> {
    return await this.documentService.healthCheck();
  }
}
