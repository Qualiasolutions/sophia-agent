/**
 * Enhanced Document Generation Service
 *
 * Integrates enhanced templates, semantic intent classification, and analytics
 * to provide intelligent document generation with multi-step flows
 */

import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';
import { SemanticIntentService } from './semantic-intent.service';
import { TemplateAnalyticsService } from './template-analytics.service';
import { FlowPerformanceService } from './flow-performance.service';
import { OpenAIOptimizerService } from './openai-optimizer.service';

export interface EnhancedGenerationRequest {
  message: string;
  agentId?: string;
  sessionId?: string;
  context?: Record<string, any>;
  previousStep?: string;
  collectedFields?: Record<string, any>;
}

export interface EnhancedGenerationResponse {
  type: 'question' | 'document' | 'error';
  content: string;
  templateId?: string;
  templateName?: string;
  nextStep?: string;
  fieldDefinitions?: any;
  collectedFields?: Record<string, any>;
  missingFields?: string[];
  metadata?: {
    category: string;
    confidence: number;
    processingTime: number;
    tokensUsed: number;
    matchType: string;
  };
}

export interface DocumentSession {
  id: string;
  templateId: string;
  templateName: string;
  currentStep: string;
  collectedFields: Record<string, any>;
  missingFields: string[];
  flow?: any;
  fieldDefinitions?: any;
  status: 'collecting' | 'generating' | 'completed' | 'abandoned';
  createdAt: Date;
  updatedAt: Date;
}

export class EnhancedDocumentService {
  private openai: OpenAI;
  private intentService: SemanticIntentService;
  private analyticsService: TemplateAnalyticsService;
  private flowPerformanceService: FlowPerformanceService;
  private openaiOptimizer: OpenAIOptimizerService;
  private supabase: any;
  private sessionCache = new Map<string, DocumentSession>();
  private templateCache = new Map<string, any>();
  private flowCache = new Map<string, any>();
  private stepStartTimes = new Map<string, number>(); // Track step start times
  private readonly maxCacheSize = 100;
  private readonly cacheTTL = 30 * 60 * 1000; // 30 minutes

  constructor(openaiApiKey: string, supabaseUrl?: string, supabaseKey?: string) {
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.intentService = new SemanticIntentService(openaiApiKey);
    this.analyticsService = new TemplateAnalyticsService();
    this.flowPerformanceService = new FlowPerformanceService();
    this.openaiOptimizer = new OpenAIOptimizerService(openaiApiKey, {
      enableCache: true,
      cacheTTL: 60,
      maxTokens: 1500,
      useSimpleModel: true,
      temperature: 0.3
    });

    // Initialize Supabase client
    this.supabase = createClient(
      supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Clean expired cache entries
   */
  private cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.templateCache.entries()) {
      if (now - value.timestamp > this.cacheTTL) {
        this.templateCache.delete(key);
      }
    }
    for (const [key, value] of this.flowCache.entries()) {
      if (now - value.timestamp > this.cacheTTL) {
        this.flowCache.delete(key);
      }
    }
  }

  /**
   * Add to cache with size limit
   */
  private addToCache<K, V>(
    cache: Map<K, V & { timestamp: number }>,
    key: K,
    value: V
  ) {
    this.cleanCache();
    if (cache.size >= this.maxCacheSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }
    cache.set(key, { ...value, timestamp: Date.now() });
  }

  /**
   * Generate document with enhanced flow management
   */
  async generateDocument(request: EnhancedGenerationRequest): Promise<EnhancedGenerationResponse> {
    const startTime = Date.now();

    try {
      // Check if we're continuing a session
      if (request.sessionId) {
        const session = await this.getSession(request.sessionId);
        if (session) {
          return await this.continueFlow(session, request);
        }
      }

      // Classify intent
      const intentResults = await this.intentService.classifyIntent(request.message, {
        threshold: 0.7,
        useHybrid: true
      });

      if (intentResults.length === 0) {
        return {
          type: 'error',
          content: "I'm not sure what type of document you need. Could you provide more details?",
          metadata: {
            category: 'unknown',
            confidence: 0,
            processingTime: Date.now() - startTime,
            tokensUsed: 0,
            matchType: 'none'
          }
        };
      }

      const bestMatch = intentResults[0]!;

      // Get enhanced template
      const template = await this.getEnhancedTemplate(bestMatch.templateId);
      if (!template) {
        return {
          type: 'error',
          content: "I'm having trouble finding the right template. Please try again.",
          metadata: {
            category: bestMatch.category,
            confidence: bestMatch.confidence,
            processingTime: Date.now() - startTime,
            tokensUsed: 0,
            matchType: bestMatch.matchType
          }
        };
      }

      // Check if template has a flow
      if (template.flow && template.flow.steps && template.flow.steps.length > 0) {
        return await this.startFlow(template, request, bestMatch);
      }

      // Direct document generation
      return await this.generateDirect(template, request, bestMatch);

    } catch (error) {
      console.error('Document generation failed:', error);
      return {
        type: 'error',
        content: "I'm experiencing technical difficulties. Please try again later.",
        metadata: {
          category: 'error',
          confidence: 0,
          processingTime: Date.now() - startTime,
          tokensUsed: 0,
          matchType: 'error'
        }
      };
    }
  }

  /**
   * Start multi-step flow
   */
  private async startFlow(
    template: any,
    request: EnhancedGenerationRequest,
    intentResult: any
  ): Promise<EnhancedGenerationResponse> {
    // Create session
    const sessionId = request.sessionId || `session_${Date.now()}`;
    const firstStep = template.flow.steps[0];

    const session: DocumentSession = {
      id: sessionId,
      templateId: template.template_id,
      templateName: template.name,
      currentStep: firstStep.id,
      collectedFields: request.collectedFields || {},
      missingFields: this.getRequiredFields(template.fields.required),
      flow: template.flow,
      status: 'collecting',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save session
    await this.saveSession(session);

    // Track flow start event
    const flowId = `${template.template_id}_${template.flow?.id || 'default'}`;
    this.stepStartTimes.set(`${sessionId}_${firstStep.id}`, Date.now());

    await this.flowPerformanceService.recordEvent({
      sessionId,
      flowId,
      templateId: template.template_id,
      stepId: firstStep.id,
      eventType: 'step_start',
      timestamp: new Date(),
      metadata: {
        platform: request.context?.platform,
        agentId: request.agentId
      }
    });

    return {
      type: 'question',
      content: firstStep.content,
      templateId: template.template_id,
      templateName: template.name,
      nextStep: firstStep.id,
      fieldDefinitions: template.fields,
      metadata: {
        category: template.category,
        confidence: intentResult.confidence,
        processingTime: 0,
        tokensUsed: 0,
        matchType: intentResult.matchType
      }
    };
  }

  /**
   * Continue multi-step flow
   */
  private async continueFlow(
    session: DocumentSession,
    request: EnhancedGenerationRequest
  ): Promise<EnhancedGenerationResponse> {
    // Extract fields from user response
    const extractedFields = await this.extractFields(request.message, session.fieldDefinitions);
    session.collectedFields = { ...session.collectedFields, ...extractedFields };
    session.updatedAt = new Date();

    // Track step completion
    const flowId = `${session.templateId}_${session.flow?.id || 'default'}`;
    const stepKey = `${session.id}_${session.currentStep}`;
    const stepStartTime = this.stepStartTimes.get(stepKey);
    const timeSpent = stepStartTime ? Date.now() - stepStartTime : undefined;

    await this.flowPerformanceService.recordEvent({
      sessionId: session.id,
      flowId,
      templateId: session.templateId,
      stepId: session.currentStep,
      eventType: 'step_complete',
      timestamp: new Date(),
      timeSpent,
      metadata: {
        extractedFields: Object.keys(extractedFields),
        platform: request.context?.platform
      }
    });

    // Find next step
    const currentStep = session.flow.steps.find((s: any) => s.id === session.currentStep);
    if (!currentStep) {
      return {
        type: 'error',
        content: "Invalid flow step. Please start over.",
        metadata: {
          category: 'error',
          confidence: 0,
          processingTime: 0,
          tokensUsed: 0,
          matchType: 'error'
        }
      };
    }

    // Check if this step has options and user selected one
    let nextStepId = currentStep.nextStep;
    if (currentStep.options) {
      const selectedOption = this.findOption(request.message, currentStep.options);
      if (selectedOption) {
        // Find the decision point or next step based on selection
        const decisionPoint = session.flow.decisionPoints?.find(
          (dp: any) => dp.question === currentStep.content
        );
        if (decisionPoint) {
          const option = decisionPoint.options.find((o: any) => o.value === selectedOption);
          if (option) {
            nextStepId = option.nextStep;
          }
        }
      }
    }

    // Find next step in flow
    const nextStep = session.flow.steps.find((s: any) => s.id === nextStepId);

    if (!nextStep || nextStep.type === 'generation') {
      // Flow complete, generate document
      session.status = 'generating';
      await this.saveSession(session);

      const template = await this.getEnhancedTemplate(session.templateId);
      if (!template) {
        return {
          type: 'error',
          content: "Template not found.",
          metadata: {
            category: 'error',
            confidence: 0,
            processingTime: 0,
            tokensUsed: 0,
            matchType: 'error'
          }
        };
      }

      return await this.generateDocumentFromSession(template, session);
    }

    // Continue to next step
    session.currentStep = nextStep.id;
    await this.saveSession(session);

    // Track next step start
    this.stepStartTimes.set(`${session.id}_${nextStep.id}`, Date.now());
    await this.flowPerformanceService.recordEvent({
      sessionId: session.id,
      flowId,
      templateId: session.templateId,
      stepId: nextStep.id,
      eventType: 'step_start',
      timestamp: new Date(),
      metadata: {
        stepIndex: session.flow.steps.findIndex((s: any) => s.id === nextStep.id)
      }
    });

    return {
      type: 'question',
      content: nextStep.content,
      templateId: session.templateId,
      templateName: session.templateName,
      nextStep: nextStep.id,
      fieldDefinitions: session.fieldDefinitions,
      collectedFields: session.collectedFields,
      missingFields: this.getMissingFields(session),
      metadata: {
        category: 'registration',
        confidence: 0.9,
        processingTime: 0,
        tokensUsed: 0,
        matchType: 'hybrid'
      }
    };
  }

  /**
   * Generate document directly (no flow)
   */
  private async generateDirect(
    template: any,
    request: EnhancedGenerationRequest,
    intentResult: any
  ): Promise<EnhancedGenerationResponse> {
    const startTime = Date.now();

    // Generate document with OpenAI
    const { content, tokensUsed } = await this.generateWithOpenAI(
      template,
      request.message,
      request.context
    );

    const processingTime = Date.now() - startTime;

    // Record analytics
    await this.analyticsService.recordUsage(template.template_id, {
      responseTime: processingTime,
      tokensUsed,
      success: true,
      confidence: intentResult.confidence,
      matchType: intentResult.matchType
    });

    return {
      type: 'document',
      content,
      templateId: template.template_id,
      templateName: template.name,
      metadata: {
        category: template.category,
        confidence: intentResult.confidence,
        processingTime,
        tokensUsed,
        matchType: intentResult.matchType
      }
    };
  }

  /**
   * Generate document from session data
   */
  private async generateDocumentFromSession(
    template: any,
    session: DocumentSession
  ): Promise<EnhancedGenerationResponse> {
    const startTime = Date.now();

    // Fill in template variables
    let content = template.content.body;

    // Replace variables with collected data
    template.content.variables.forEach((variable: any) => {
      const value = session.collectedFields[variable.mapping] || variable.default || `{{${variable.mapping}}}`;
      content = content.replace(new RegExp(variable.template, 'g'), value);
    });

    const processingTime = Date.now() - startTime;
    const tokensUsed = Math.ceil(content.length / 4); // Rough estimate

    // Record analytics
    await this.analyticsService.recordUsage(template.template_id, {
      responseTime: processingTime,
      tokensUsed,
      success: true,
      confidence: 0.95,
      matchType: 'hybrid'
    });

    // Mark session as completed
    session.status = 'completed';
    await this.saveSession(session);

    // Track flow completion
    const flowId = `${template.template_id}_${session.flow?.id || 'default'}`;
    await this.flowPerformanceService.recordEvent({
      sessionId: session.id,
      flowId,
      templateId: template.template_id,
      stepId: 'complete',
      eventType: 'flow_complete',
      timestamp: new Date(),
      metadata: {
        totalFields: Object.keys(session.collectedFields).length,
        documentGenerated: true
      }
    });

    // Send subject line if available
    if (template.content.subject) {
      // This would be sent as a separate message in real implementation
      console.log(`Subject: ${template.content.subject}`);
    }

    return {
      type: 'document',
      content,
      templateId: template.template_id,
      templateName: template.name,
      metadata: {
        category: template.category,
        confidence: 0.95,
        processingTime,
        tokensUsed,
        matchType: 'hybrid'
      }
    };
  }

  /**
   * Generate with OpenAI (optimized)
   */
  private async generateWithOpenAI(
    template: any,
    message: string,
    context?: Record<string, any>
  ): Promise<{ content: string; tokensUsed: number }> {
    const systemPrompt = template.instructions.systemPrompt || this.buildDefaultPrompt(template);

    try {
      // Use the optimized OpenAI service
      const { response, tokensUsed } = await this.openaiOptimizer.generateResponse(
        message,
        systemPrompt,
        {
          useCache: true,
          priority: 'normal',
          context: {
            templateId: template.template_id,
            category: template.category,
            platform: context?.platform
          }
        }
      );

      return { content: response, tokensUsed };

    } catch (error) {
      console.error('OpenAI generation failed:', error);

      // Fallback to direct OpenAI call if optimizer fails
      try {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: 1000,
          temperature: 0.3
        });

        const content = completion.choices[0]?.message?.content || '';
        const tokensUsed = completion.usage?.total_tokens || 0;

        return { content: content.trim(), tokensUsed };
      } catch (fallbackError) {
        throw new Error(`OpenAI generation failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Build default system prompt
   */
  private buildDefaultPrompt(template: any): string {
    return `You are generating a document for Zyprus Real Estate.

TEMPLATE: ${template.name}
CATEGORY: ${template.category}

CRITICAL RULES:
- Use exact template wording with variable replacements
- Bold field labels with *asterisks* (format: *Field Name:*)
- Never invent information - ask for missing fields
- Mask phone numbers: 99 07 67 32 → 99 XX 67 32
- Output only the document content
- No confirmation step once all fields are collected

${template.instructions.constraints?.join('\n') || ''}`;
  }

  /**
   * Get enhanced template from database with caching
   */
  private async getEnhancedTemplate(templateId: string): Promise<any> {
    // Check cache first
    const cached = this.templateCache.get(templateId);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    // Fetch from database
    const { data, error } = await this.supabase
      .from('enhanced_templates')
      .select('*')
      .eq('template_id', templateId)
      .single();

    if (error || !data) {
      return null;
    }

    // Cache the result
    this.addToCache(this.templateCache, templateId, data);

    return data;
  }

  /**
   * Save or update session
   */
  private async saveSession(session: DocumentSession): Promise<void> {
    // Cache in memory
    this.sessionCache.set(session.id, session);

    // Save to database
    await this.supabase
      .from('document_request_sessions')
      .upsert({
        id: session.id,
        document_template_id: session.templateId,
        collected_fields: session.collectedFields,
        missing_fields: session.missingFields,
        status: session.status,
        last_prompt: session.currentStep,
        updated_at: session.updatedAt
      });
  }

  /**
   * Get session from database
   */
  private async getSession(sessionId: string): Promise<DocumentSession | null> {
    // Check cache first
    if (this.sessionCache.has(sessionId)) {
      return this.sessionCache.get(sessionId)!;
    }

    // Fetch from database
    const { data, error } = await this.supabase
      .from('document_request_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      return null;
    }

    // Convert to DocumentSession
    const session: DocumentSession = {
      id: data.id,
      templateId: data.document_template_id,
      templateName: '', // Would need to fetch from template
      currentStep: data.last_prompt || '',
      collectedFields: data.collected_fields,
      missingFields: data.missing_fields,
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };

    // Cache it
    this.sessionCache.set(sessionId, session);

    return session;
  }

  /**
   * Extract fields from user message
   */
  private async extractFields(message: string, fieldDefinitions: any): Promise<Record<string, any>> {
    const extracted: Record<string, any> = {};

    // Simple extraction - in real implementation, use NLP
    fieldDefinitions.required?.forEach((field: any) => {
      // Look for patterns like "Field Name: value"
      const regex = new RegExp(`\\*?${field.label}\\*?[:\\s]+(.+?)(?=\\n|$)`, 'i');
      const match = message.match(regex);
      if (match && match[1]) {
        extracted[field.name] = match[1].trim();
      }
    });

    return extracted;
  }

  /**
   * Find selected option in user message
   */
  private findOption(message: string, options: string[]): string | null {
    const lowerMessage = message.toLowerCase();

    for (const option of options) {
      if (lowerMessage.includes(option.toLowerCase())) {
        return option;
      }
    }

    // Check for numbers
    const numberMatch = message.match(/\b(\d+)\b/);
    if (numberMatch && numberMatch[1]) {
      const index = parseInt(numberMatch[1]) - 1;
      if (index >= 0 && index < options.length) {
        return options[index] || null;
      }
    }

    return null;
  }

  /**
   * Get required fields from template
   */
  private getRequiredFields(requiredFields: any[]): string[] {
    return requiredFields?.map((f: any) => f.name) || [];
  }

  /**
   * Get missing fields for session
   */
  private getMissingFields(session: DocumentSession): string[] {
    const required = this.getRequiredFields(session.fieldDefinitions?.required || []);
    return required.filter(field => !session.collectedFields[field]);
  }

  /**
   * Clear session cache
   */
  clearSessionCache(): void {
    this.sessionCache.clear();
  }

  /**
   * Get active sessions
   */
  getActiveSessions(): DocumentSession[] {
    return Array.from(this.sessionCache.values()).filter(s => s.status !== 'completed');
  }

  /**
   * Mark session as abandoned (called by cleanup job)
   */
  async markSessionAsAbandoned(sessionId: string): Promise<void> {
    const session = this.sessionCache.get(sessionId);
    if (!session || session.status === 'completed') {
      return;
    }

    session.status = 'abandoned';
    await this.saveSession(session);

    // Track abandonment
    const flowId = `${session.templateId}_${session.flow?.id || 'default'}`;
    await this.flowPerformanceService.recordEvent({
      sessionId,
      flowId,
      templateId: session.templateId,
      stepId: session.currentStep,
      eventType: 'flow_abandon',
      timestamp: new Date(),
      metadata: {
        lastStep: session.currentStep,
        fieldsCollected: Object.keys(session.collectedFields).length,
        timeSinceLastUpdate: Date.now() - session.updatedAt.getTime()
      }
    });
  }

  /**
   * Clean up old abandoned sessions
   */
  async cleanupAbandonedSessions(maxAgeHours: number = 24): Promise<void> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - maxAgeHours);

    const { data: oldSessions } = await this.supabase
      .from('document_request_sessions')
      .select('id, template_id, current_step, collected_fields, updated_at')
      .eq('status', 'collecting')
      .lt('updated_at', cutoffTime.toISOString());

    if (oldSessions) {
      for (const session of oldSessions) {
        await this.markSessionAsAbandoned(session.id);
      }
    }
  }

  /**
   * Get OpenAI usage statistics
   */
  getOpenAIUsageStats() {
    return this.openaiOptimizer.getUsageStats();
  }

  /**
   * Clear OpenAI cache
   */
  clearOpenAICache(): void {
    this.openaiOptimizer.clearCache();
  }
}