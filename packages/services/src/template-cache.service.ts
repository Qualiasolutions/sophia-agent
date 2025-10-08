/**
 * Template Cache Service
 *
 * Centralized template repository with intelligent caching,
 * performance monitoring, and dynamic updates.
 */

import { createClient } from '@supabase/supabase-js';
import { TemplateIntentClassifier, DocumentCategory } from './template-intent.service';
import { TemplateOptimizer, OptimizedTemplate } from './template-optimizer.service';

interface CacheEntry {
  template: OptimizedTemplate;
  cachedAt: number;
  accessCount: number;
  lastAccessed: number;
}

interface PerformanceMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  popularTemplates: Array<{
    templateId: string;
    usage: number;
    averageTime: number;
  }>;
}

export class TemplateCacheService {
  private cache = new Map<string, CacheEntry>();
  private supabase;
  private intentClassifier: TemplateIntentClassifier;
  private templateOptimizer: TemplateOptimizer;
  private metrics: PerformanceMetrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
    popularTemplates: []
  };

  // Cache configuration
  private readonly maxCacheSize = 100;
  private readonly cacheTTL = 30 * 60 * 1000; // 30 minutes
  private readonly preloadTemplates = [
    'seller_registration_standard',
    'email_good_client_request',
    'viewing_form_advanced',
    'agreement_marketing_email'
  ];

  constructor(
    supabaseUrl: string,
    supabaseServiceKey: string
  ) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.intentClassifier = new TemplateIntentClassifier();
    this.templateOptimizer = new TemplateOptimizer();

    // Initialize cache with popular templates
    this.initializeCache();
  }

  /**
   * Initialize cache with frequently used templates
   */
  private async initializeCache(): Promise<void> {
    const preloadPromises = this.preloadTemplates.map(templateId =>
      this.loadTemplate(templateId, 'registration', '').catch(err => {
        console.warn(`Failed to preload template ${templateId}:`, err);
        return null;
      })
    );

    await Promise.allSettled(preloadPromises);
    console.log(`Cache initialized with ${this.cache.size} templates`);
  }

  /**
   * Get template with intelligent caching
   */
  async getTemplate(
    templateId: string,
    category: DocumentCategory = 'email',
    subcategory: string = 'general'
  ): Promise<OptimizedTemplate> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    const cacheKey = `${category}/${subcategory}/${templateId}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && !this.isExpired(cached)) {
      // Update access metrics
      cached.accessCount++;
      cached.lastAccessed = Date.now();

      this.metrics.cacheHits++;
      this.updateMetrics(Date.now() - startTime);

      return cached.template;
    }

    // Cache miss - load template
    this.metrics.cacheMisses++;

    try {
      const template = await this.loadTemplate(templateId, category, subcategory);

      // Cache the template
      this.cache.set(cacheKey, {
        template,
        cachedAt: Date.now(),
        accessCount: 1,
        lastAccessed: Date.now()
      });

      // Maintain cache size
      this.maintainCacheSize();

      this.updateMetrics(Date.now() - startTime);

      return template;
    } catch (error) {
      console.error(`Failed to load template ${templateId}:`, error);
      throw new Error(`Template not available: ${templateId}`);
    }
  }

  /**
   * Load template from file system or database
   */
  private async loadTemplate(
    templateId: string,
    category: DocumentCategory,
    subcategory: string
  ): Promise<OptimizedTemplate> {
    // Try database first
    const dbTemplate = await this.loadFromDatabase(templateId);
    if (dbTemplate) {
      return dbTemplate;
    }

    // Fall back to file system
    const templatePath = `${templateId}.txt`;
    return await this.templateOptimizer.loadTemplate(
      templatePath,
      category,
      subcategory
    );
  }

  /**
   * Load template from Supabase database
   */
  private async loadFromDatabase(templateId: string): Promise<OptimizedTemplate | null> {
    try {
      const { data, error } = await this.supabase
        .from('template_cache')
        .select('*')
        .eq('template_id', templateId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.template_id,
        name: data.name,
        category: data.category,
        subcategory: data.subcategory || 'general',
        content: data.content,
        variables: data.variables || [],
        requiredFields: data.required_fields || [],
        optionalFields: data.optional_fields || [],
        subjectLine: data.subject_line,
        instructions: data.instructions || '',
        estimatedTokens: data.estimated_tokens || 0,
        version: data.version || '1.0.0',
        lastUpdated: data.updated_at,
        metadata: data.metadata || {
          usage: 0,
          averageResponseTime: 2000,
          successRate: 0.95,
          tags: [],
          relatedTemplates: []
        }
      };
    } catch (error) {
      console.warn(`Database template load failed for ${templateId}:`, error);
      return null;
    }
  }

  /**
   * Save template to database for persistence
   */
  async saveTemplate(template: OptimizedTemplate): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('template_cache')
        .upsert({
          template_id: template.id,
          name: template.name,
          category: template.category,
          subcategory: template.subcategory,
          content: template.content,
          variables: template.variables,
          required_fields: template.requiredFields,
          optional_fields: template.optionalFields,
          subject_line: template.subjectLine,
          instructions: template.instructions,
          estimated_tokens: template.estimatedTokens,
          version: template.version,
          is_active: true,
          metadata: template.metadata,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to save template to database:', error);
        throw error;
      }

      // Update cache
      const cacheKey = `${template.category}/${template.subcategory}/${template.id}`;
      this.cache.set(cacheKey, {
        template,
        cachedAt: Date.now(),
        accessCount: 1,
        lastAccessed: Date.now()
      });

    } catch (error) {
      console.error('Template save failed:', error);
      throw error;
    }
  }

  /**
   * Get multiple templates efficiently
   */
  async getMultipleTemplates(
    requests: Array<{ templateId: string; category?: DocumentCategory; subcategory?: string }>
  ): Promise<OptimizedTemplate[]> {
    const promises = requests.map(req =>
      this.getTemplate(
        req.templateId,
        req.category || 'email',
        req.subcategory || 'general'
      )
    );

    return Promise.all(promises);
  }

  /**
   * Search templates by category, tags, or content
   */
  async searchTemplates(query: {
    category?: DocumentCategory;
    tags?: string[];
    searchText?: string;
    limit?: number;
  }): Promise<OptimizedTemplate[]> {
    try {
      let dbQuery = this.supabase
        .from('template_cache')
        .select('*')
        .eq('is_active', true);

      if (query.category) {
        dbQuery = dbQuery.eq('category', query.category);
      }

      if (query.searchText) {
        dbQuery = dbQuery.ilike('content', `%${query.searchText}%`);
      }

      if (query.limit) {
        dbQuery = dbQuery.limit(query.limit);
      }

      const { data, error } = await dbQuery;

      if (error) {
        throw error;
      }

      return (data || []).map(item => ({
        id: item.template_id,
        name: item.name,
        category: item.category,
        subcategory: item.subcategory || 'general',
        content: item.content,
        variables: item.variables || [],
        requiredFields: item.required_fields || [],
        optionalFields: item.optional_fields || [],
        subjectLine: item.subject_line,
        instructions: item.instructions || '',
        estimatedTokens: item.estimated_tokens || 0,
        version: item.version || '1.0.0',
        lastUpdated: item.updated_at,
        metadata: item.metadata || {
          usage: 0,
          averageResponseTime: 2000,
          successRate: 0.95,
          tags: [],
          relatedTemplates: []
        }
      }));
    } catch (error) {
      console.error('Template search failed:', error);
      return [];
    }
  }

  /**
   * Get template suggestions based on intent
   */
  async getTemplateSuggestions(message: string): Promise<OptimizedTemplate[]> {
    const classification = this.intentClassifier.classifyIntent(message);

    // Get top 3 likely templates
    const suggestions = await this.getMultipleTemplates(
      classification.likelyTemplates.slice(0, 3).map(templateId => ({
        templateId,
        category: classification.category
      }))
    );

    // Sort by confidence and usage
    return suggestions.sort((a, b) => {
      const aScore = classification.likelyTemplates.indexOf(a.id) + (a.metadata.usage * 0.01);
      const bScore = classification.likelyTemplates.indexOf(b.id) + (b.metadata.usage * 0.01);
      return aScore - bScore;
    });
  }

  /**
   * Update template performance metrics
   */
  async updateTemplateMetrics(
    templateId: string,
    responseTime: number,
    success: boolean
  ): Promise<void> {
    try {
      // Update cache metrics
      for (const [, entry] of this.cache.entries()) {
        if (entry.template.id === templateId) {
          const currentAvg = entry.template.metadata.averageResponseTime;
          const usage = entry.template.metadata.usage;

          // Calculate new average
          entry.template.metadata.averageResponseTime =
            (currentAvg * usage + responseTime) / (usage + 1);

          entry.template.metadata.usage = usage + 1;

          // Update success rate
          const currentRate = entry.template.metadata.successRate;
          entry.template.metadata.successRate =
            (currentRate * usage + (success ? 1 : 0)) / (usage + 1);

          entry.template.metadata.lastUsed = new Date().toISOString();

          break;
        }
      }

      // Update database asynchronously
      this.updateDatabaseMetrics(templateId, responseTime, success);

    } catch (error) {
      console.error('Failed to update template metrics:', error);
    }
  }

  /**
   * Update metrics in database (fire and forget)
   */
  private async updateDatabaseMetrics(
    templateId: string,
    responseTime: number,
    success: boolean
  ): Promise<void> {
    try {
      const { data: template } = await this.supabase
        .from('template_cache')
        .select('metadata')
        .eq('template_id', templateId)
        .single();

      if (template?.metadata) {
        const usage = template.metadata.usage || 0;
        const currentAvg = template.metadata.averageResponseTime || 2000;
        const currentRate = template.metadata.successRate || 0.95;

        const newMetadata = {
          ...template.metadata,
          usage: usage + 1,
          averageResponseTime: (currentAvg * usage + responseTime) / (usage + 1),
          successRate: (currentRate * usage + (success ? 1 : 0)) / (usage + 1),
          lastUsed: new Date().toISOString()
        };

        await this.supabase
          .from('template_cache')
          .update({ metadata: newMetadata })
          .eq('template_id', templateId);
      }
    } catch (error) {
      console.warn('Failed to update database metrics:', error);
    }
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.cachedAt > this.cacheTTL;
  }

  /**
   * Maintain cache size by removing least used entries
   */
  private maintainCacheSize(): void {
    if (this.cache.size <= this.maxCacheSize) {
      return;
    }

    // Sort entries by last access time and usage
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => {
        const scoreA = a.lastAccessed + (a.accessCount * 1000);
        const scoreB = b.lastAccessed + (b.accessCount * 1000);
        return scoreA - scoreB;
      });

    // Remove oldest entries
    const toRemove = entries.slice(0, entries.length - this.maxCacheSize);
    toRemove.forEach(([key]) => this.cache.delete(key));

    console.log(`Cache cleanup: removed ${toRemove.length} entries`);
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(responseTime: number): void {
    const totalRequests = this.metrics.totalRequests;
    const currentAvg = this.metrics.averageResponseTime;

    this.metrics.averageResponseTime =
      (currentAvg * (totalRequests - 1) + responseTime) / totalRequests;
  }

  /**
   * Get cache performance metrics
   */
  getMetrics(): PerformanceMetrics & {
    cacheHitRate: number;
    cacheSize: number;
    cacheUtilization: number;
  } {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.totalRequests > 0
        ? this.metrics.cacheHits / this.metrics.totalRequests
        : 0,
      cacheSize: this.cache.size,
      cacheUtilization: this.cache.size / this.maxCacheSize
    };
  }

  /**
   * Clear cache and reset metrics
   */
  clearCache(): void {
    this.cache.clear();
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      popularTemplates: []
    };
  }

  /**
   * Preload templates based on usage patterns
   */
  async preloadPopularTemplates(): Promise<void> {
    try {
      const { data: popularTemplates } = await this.supabase
        .from('template_cache')
        .select('template_id, category, subcategory')
        .eq('is_active', true)
        .order('metadata->>usage', { ascending: false })
        .limit(10);

      if (popularTemplates) {
        const preloadPromises = popularTemplates.map(template =>
          this.getTemplate(
            template.template_id,
            template.category,
            template.subcategory || 'general'
          ).catch(err => {
            console.warn(`Failed to preload ${template.template_id}:`, err);
            return null;
          })
        );

        await Promise.allSettled(preloadPromises);
        console.log(`Preloaded ${popularTemplates.length} popular templates`);
      }
    } catch (error) {
      console.error('Failed to preload popular templates:', error);
    }
  }
}