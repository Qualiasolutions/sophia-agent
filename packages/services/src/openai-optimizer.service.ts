/**
 * OpenAI Optimization Service
 * Reduces token usage and improves response speed
 */

import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';

export interface OptimizationConfig {
  enableCache: boolean;
  cacheTTL: number; // minutes
  maxTokens: number;
  temperature: number;
  useSimpleModel: boolean;
  useStreaming: boolean;
}

export interface CachedResponse {
  id: string;
  promptHash: string;
  response: string;
  model: string;
  tokensUsed: number;
  createdAt: Date;
  expiresAt: Date;
}

export interface TokenUsageStats {
  totalTokens: number;
  totalCost: number;
  averageTokensPerRequest: number;
  cacheHitRate: number;
  requestsPerHour: number;
}

export class OpenAIOptimizerService {
  private openai: OpenAI;
  private responseCache = new Map<string, CachedResponse>();
  private config: OptimizationConfig;
  private supabase: any;
  private stats: TokenUsageStats = {
    totalTokens: 0,
    totalCost: 0,
    averageTokensPerRequest: 0,
    cacheHitRate: 0,
    requestsPerHour: 0
  };

  constructor(apiKey: string, config?: Partial<OptimizationConfig>) {
    this.openai = new OpenAI({ apiKey });
    this.config = {
      enableCache: true,
      cacheTTL: 60, // 1 hour
      maxTokens: 1500,
      temperature: 0.3,
      useSimpleModel: true, // Use gpt-4o-mini by default
      useStreaming: false,
      ...config
    };

    // Initialize Supabase
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Generate optimized response with caching
   */
  async generateResponse(
    prompt: string,
    systemPrompt?: string,
    options?: {
      useCache?: boolean;
      priority?: 'low' | 'normal' | 'high';
      context?: Record<string, any>;
    }
  ): Promise<{ response: string; tokensUsed: number; cached: boolean }> {
    const startTime = Date.now();
    const useCache = options?.useCache ?? this.config.enableCache;

    // Generate prompt hash for caching
    const promptHash = this.hashPrompt(prompt, systemPrompt);

    // Check cache first
    if (useCache) {
      const cached = this.getCachedResponse(promptHash);
      if (cached) {
        this.updateStats(0, 'cache_hit');
        return {
          response: cached.response,
          tokensUsed: 0,
          cached: true
        };
      }
    }

    // Select model based on priority
    const model = this.selectModel(options?.priority || 'normal');

    // Optimize prompt to reduce tokens
    const optimizedPrompt = this.optimizePrompt(prompt, systemPrompt);

    try {
      const completion = await this.openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt || this.getDefaultSystemPrompt() },
          { role: 'user', content: optimizedPrompt }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        stream: this.config.useStreaming,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      });

      const response = completion.choices[0]?.message?.content || '';
      const tokensUsed = completion.usage?.total_tokens || 0;

      // Cache the response
      if (useCache && tokensUsed > 0) {
        this.cacheResponse(promptHash, response, model, tokensUsed);
      }

      // Update stats
      this.updateStats(tokensUsed, 'api_request');

      // Store in database for analytics
      await this.storeUsageStats({
        prompt,
        response,
        model,
        tokensUsed,
        responseTime: Date.now() - startTime,
        cached: false,
        context: options?.context
      });

      return {
        response: response.trim(),
        tokensUsed,
        cached: false
      };

    } catch (error) {
      console.error('OpenAI API error:', error);

      // Try with simpler prompt if failed
      if (prompt.length > 2000) {
        return this.generateResponse(
          this.shortenPrompt(prompt),
          systemPrompt,
          options
        );
      }

      throw new Error(`OpenAI generation failed: ${error.message}`);
    }
  }

  /**
   * Generate with template-specific optimization
   */
  async generateFromTemplate(
    template: any,
    variables: Record<string, any>,
    context?: Record<string, any>
  ): Promise<{ content: string; tokensUsed: number }> {
    // Pre-fill template with variables to reduce prompt size
    let prompt = template.instructions?.systemPrompt || '';

    // Add only missing variables to prompt
    const missingVars = this.getMissingVariables(template, variables);
    if (missingVars.length > 0) {
      prompt += `\n\nMissing information needed:\n${missingVars.join('\n')}`;
    }

    // Use cached template-specific responses
    const templateHash = this.hashPrompt(
      template.template_id,
      JSON.stringify(variables)
    );

    const cached = this.getCachedResponse(templateHash);
    if (cached) {
      // Fill in variables
      let content = cached.response;
      Object.entries(variables).forEach(([key, value]) => {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });

      return { content, tokensUsed: 0 };
    }

    // Generate new response
    const { response, tokensUsed } = await this.generateResponse(
      prompt,
      undefined,
      {
        useCache: true,
        context: { templateId: template.template_id, ...context }
      }
    );

    // Cache the template response
    this.cacheResponse(templateHash, response, 'gpt-4o-mini', tokensUsed);

    return { content: response, tokensUsed };
  }

  /**
   * Batch generate multiple responses
   */
  async batchGenerate(
    requests: Array<{
      prompt: string;
      systemPrompt?: string;
      priority?: 'low' | 'normal' | 'high';
    }>
  ): Promise<Array<{ response: string; tokensUsed: number; cached: boolean }>> {
    // Process in parallel for better performance
    const promises = requests.map(req =>
      this.generateResponse(req.prompt, req.systemPrompt, {
        priority: req.priority
      })
    );

    return Promise.all(promises);
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): TokenUsageStats {
    return { ...this.stats };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.responseCache.clear();
  }

  /**
   * Private helper methods
   */
  private hashPrompt(prompt: string, systemPrompt?: string): string {
    const combined = systemPrompt ? `${systemPrompt}\n${prompt}` : prompt;
    // Simple hash - in production use crypto
    return btoa(combined).slice(0, 32);
  }

  private getCachedResponse(hash: string): CachedResponse | null {
    const cached = this.responseCache.get(hash);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt.getTime()) {
      this.responseCache.delete(hash);
      return null;
    }

    return cached;
  }

  private cacheResponse(
    hash: string,
    response: string,
    model: string,
    tokensUsed: number
  ): void {
    const cached: CachedResponse = {
      id: `cache_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      promptHash: hash,
      response,
      model,
      tokensUsed,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.config.cacheTTL * 60 * 1000)
    };

    this.responseCache.set(hash, cached);

    // Limit cache size
    if (this.responseCache.size > 100) {
      const firstKey = this.responseCache.keys().next().value;
      this.responseCache.delete(firstKey);
    }
  }

  private selectModel(priority: 'low' | 'normal' | 'high'): string {
    if (priority === 'low' || this.config.useSimpleModel) {
      return 'gpt-4o-mini';
    }
    return 'gpt-4o';
  }

  private optimizePrompt(prompt: string, systemPrompt?: string): string {
    // Remove redundant whitespace
    let optimized = prompt.replace(/\s+/g, ' ').trim();

    // Truncate if too long
    if (optimized.length > 3000) {
      optimized = optimized.substring(0, 2970) + '...';
    }

    // Remove common filler words
    optimized = optimized.replace(/\b(please|kindly|could you|would you)\b/gi, '');

    return optimized;
  }

  private getDefaultSystemPrompt(): string {
    return `You are Sophia, an AI assistant for real estate professionals. Be concise, helpful, and professional. Use clear, structured responses.`;
  }

  private shortenPrompt(prompt: string): string {
    // Keep only first and last paragraphs
    const paragraphs = prompt.split('\n\n');
    if (paragraphs.length <= 2) return prompt;

    return `${paragraphs[0]}\n\n...\n\n${paragraphs[paragraphs.length - 1]}`;
  }

  private getMissingVariables(template: any, variables: Record<string, any>): string[] {
    const missing: string[] = [];

    if (template.content?.variables) {
      template.content.variables.forEach((variable: any) => {
        if (!variables[variable.mapping] && !variable.default) {
          missing.push(`- ${variable.name || variable.mapping}`);
        }
      });
    }

    return missing;
  }

  private updateStats(tokensUsed: number, type: 'api_request' | 'cache_hit'): void {
    this.stats.totalTokens += tokensUsed;

    // Calculate cost (rough estimate)
    const costPerToken = 0.000002; // ~$0.002 per 1K tokens for gpt-4o-mini
    this.stats.totalCost += tokensUsed * costPerToken;

    // Update cache hit rate
    if (type === 'cache_hit') {
      const total = this.stats.requestsPerHour + 1;
      this.stats.cacheHitRate = (this.stats.cacheHitRate * (total - 1) + 1) / total;
    }
    this.stats.requestsPerHour++;
  }

  private async storeUsageStats(data: {
    prompt: string;
    response: string;
    model: string;
    tokensUsed: number;
    responseTime: number;
    cached: boolean;
    context?: Record<string, any>;
  }): Promise<void> {
    await this.supabase
      .from('openai_usage_stats')
      .insert({
        prompt_hash: this.hashPrompt(data.prompt),
        model: data.model,
        tokens_used: data.tokensUsed,
        response_time: data.responseTime,
        cached: data.cached,
        context: data.context,
        created_at: new Date().toISOString()
      });
  }
}