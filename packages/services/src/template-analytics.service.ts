/**
 * Template Performance Analytics Service
 *
 * Tracks, analyzes, and optimizes template performance based on usage patterns
 */

import { supabase } from '@sophiaai/database';

export interface TemplateMetrics {
  templateId: string;
  templateName: string;
  category: string;
  usageCount: number;
  successRate: number;
  averageResponseTime: number;
  lastUsed: Date;
  tokensUsed: number;
  costEstimate: number;
  userSatisfaction: number;
  errorRate: number;
  cacheHitRate: number;
  popularityScore: number;
}

export interface AnalyticsFilter {
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  agentId?: string;
  limit?: number;
  sortBy?: 'usage' | 'successRate' | 'responseTime' | 'popularity';
}

export interface PerformanceReport {
  period: {
    from: Date;
    to: Date;
  };
  summary: {
    totalGenerations: number;
    averageResponseTime: number;
    overallSuccessRate: number;
    totalCost: number;
    activeTemplates: number;
  };
  topTemplates: Array<{
    templateId: string;
    templateName: string;
    usageCount: number;
    percentage: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    percentage: number;
    avgResponseTime: number;
    successRate: number;
  }>;
  trends: {
    dailyUsage: Array<{
      date: string;
      count: number;
    }>;
    responseTimeTrend: Array<{
      date: string;
      avgTime: number;
    }>;
  };
  recommendations: Array<{
    type: 'optimize' | 'promote' | 'deprecate' | 'investigate';
    templateId: string;
    message: string;
    impact: 'high' | 'medium' | 'low';
  }>;
}

export class TemplateAnalyticsService {
  /**
   * Track template usage
   */
  async trackUsage(
    templateId: string,
    metrics: {
      success: boolean;
      responseTime: number;
      tokensUsed: number;
      agentId?: string;
      sessionId?: string;
      errorMessage?: string;
      cacheHit?: boolean;
    }
  ): Promise<void> {
    // Update template analytics
    await supabase.rpc('update_template_analytics', {
      p_template_id: templateId,
      p_usage_count_increment: 1,
      p_success: metrics.success,
      p_response_time: metrics.responseTime
    });

    // Log detailed generation record
    await supabase
      .from('optimized_document_generations')
      .insert({
        template_id: templateId,
        template_name: await this.getTemplateName(templateId),
        category: await this.getTemplateCategory(templateId),
        processing_time_ms: metrics.responseTime,
        tokens_used: metrics.tokensUsed,
        confidence: 0.95, // Would come from intent classifier
        original_request: '', // Would be passed in
        generated_content: '', // Would be passed in
        session_id: metrics.sessionId,
        success: metrics.success,
        error_message: metrics.errorMessage,
        cache_hit: metrics.cacheHit || false,
        cost_estimate: this.calculateCost(metrics.tokensUsed),
        metadata: {
          agent_id: metrics.agentId,
          tracked_at: new Date().toISOString()
        }
      });

    // Check if template needs optimization
    await this.checkTemplateHealth(templateId);
  }

  /**
   * Get comprehensive template metrics
   */
  async getTemplateMetrics(filter: AnalyticsFilter = {}): Promise<TemplateMetrics[]> {
    let query = supabase
      .from('enhanced_templates')
      .select(`
        template_id,
        name,
        category,
        analytics,
        metadata
      `);

    // Apply filters
    if (filter.category) {
      query = query.eq('category', filter.category);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.error('Error fetching template metrics:', error);
      return [];
    }

    // Get additional metrics from optimized_document_generations
    const templateIds = data.map(t => t.template_id);
    const { data: generations } = await supabase
      .from('optimized_document_generations')
      .select('template_id, processing_time_ms, tokens_used, success, cache_hit')
      .in('template_id', templateIds);

    // Group generations by template
    const generationStats = new Map<string, any>();
    generations?.forEach(gen => {
      if (!generationStats.has(gen.template_id)) {
        generationStats.set(gen.template_id, {
          totalResponseTime: 0,
          totalTokens: 0,
          successCount: 0,
          totalCount: 0,
          cacheHits: 0
        });
      }
      const stats = generationStats.get(gen.template_id);
      stats.totalResponseTime += gen.processing_time_ms;
      stats.totalTokens += gen.tokens_used;
      if (gen.success) stats.successCount++;
      stats.totalCount++;
      if (gen.cache_hit) stats.cacheHits++;
    });

    // Combine metrics
    const metrics: TemplateMetrics[] = data.map(template => {
      const stats = generationStats.get(template.template_id) || {
        totalResponseTime: 0,
        totalTokens: 0,
        successCount: 0,
        totalCount: 0,
        cacheHits: 0
      };

      const analytics = template.analytics || {};
      const metadata = template.metadata || {};

      return {
        templateId: template.template_id,
        templateName: template.name,
        category: template.category,
        usageCount: analytics.usageCount || 0,
        successRate: stats.totalCount > 0 ? stats.successCount / stats.totalCount : 1.0,
        averageResponseTime: stats.totalCount > 0 ? stats.totalResponseTime / stats.totalCount : 0,
        lastUsed: analytics.lastUsed ? new Date(analytics.lastUsed) : new Date(0),
        tokensUsed: stats.totalTokens,
        costEstimate: this.calculateCost(stats.totalTokens),
        userSatisfaction: this.calculateSatisfactionScore(template),
        errorRate: stats.totalCount > 0 ? (stats.totalCount - stats.successCount) / stats.totalCount : 0,
        cacheHitRate: stats.totalCount > 0 ? stats.cacheHits / stats.totalCount : 0,
        popularityScore: this.calculatePopularityScore(analytics, metadata)
      };
    });

    // Sort results
    if (filter.sortBy) {
      metrics.sort((a, b) => {
        switch (filter.sortBy) {
          case 'usage':
            return b.usageCount - a.usageCount;
          case 'successRate':
            return b.successRate - a.successRate;
          case 'responseTime':
            return a.averageResponseTime - b.averageResponseTime;
          case 'popularity':
            return b.popularityScore - a.popularityScore;
          default:
            return 0;
        }
      });
    }

    return metrics.slice(0, filter.limit || 50);
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(
    dateFrom: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    dateTo: Date = new Date()
  ): Promise<PerformanceReport> {
    // Get summary statistics
    const { data: summary } = await supabase
      .from('optimized_document_generations')
      .select(`
        processing_time_ms,
        tokens_used,
        success,
        template_id
      `)
      .gte('created_at', dateFrom.toISOString())
      .lte('created_at', dateTo.toISOString());

    const totalGenerations = summary?.length || 0;
    const totalResponseTime = summary?.reduce((sum, s) => sum + s.processing_time_ms, 0) || 0;
    const successfulGenerations = summary?.filter(s => s.success).length || 0;
    const totalTokens = summary?.reduce((sum, s) => sum + s.tokens_used, 0) || 0;

    // Get top templates
    const templateCounts = new Map<string, number>();
    summary?.forEach(s => {
      templateCounts.set(s.template_id, (templateCounts.get(s.template_id) || 0) + 1);
    });

    const topTemplates = Array.from(templateCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([templateId, count]) => ({
        templateId,
        templateName: 'Template Name', // Would fetch from enhanced_templates
        usageCount: count,
        percentage: (count / totalGenerations) * 100
      }));

    // Get category breakdown
    const { data: categoryData } = await supabase
      .from('enhanced_templates')
      .select('category');

    const categoryCounts = new Map<string, { count: number; responseTime: number; successRate: number }>();
    categoryData?.forEach(cat => {
      if (!categoryCounts.has(cat.category)) {
        categoryCounts.set(cat.category, { count: 0, responseTime: 0, successRate: 0 });
      }
    });

    // Get daily usage trends
    const dailyUsage = await this.getDailyUsage(dateFrom, dateTo);

    // Get response time trends
    const responseTimeTrend = await this.getResponseTimeTrend(dateFrom, dateTo);

    // Generate recommendations
    const recommendations = await this.generateRecommendations();

    return {
      period: { from: dateFrom, to: dateTo },
      summary: {
        totalGenerations,
        averageResponseTime: totalGenerations > 0 ? totalResponseTime / totalGenerations : 0,
        overallSuccessRate: totalGenerations > 0 ? successfulGenerations / totalGenerations : 1,
        totalCost: this.calculateCost(totalTokens),
        activeTemplates: templateCounts.size
      },
      topTemplates,
      categoryBreakdown: Array.from(categoryCounts.entries()).map(([category, stats]) => ({
        category,
        count: stats.count,
        percentage: (stats.count / totalGenerations) * 100,
        avgResponseTime: stats.responseTime,
        successRate: stats.successRate
      })),
      trends: {
        dailyUsage,
        responseTimeTrend
      },
      recommendations
    };
  }

  /**
   * Get template suggestions for optimization
   */
  async getOptimizationSuggestions(): Promise<Array<{
    templateId: string;
    type: 'improve' | 'cache' | 'deprecate' | 'promote';
    reason: string;
    potentialImprovement: string;
  }>> {
    const metrics = await this.getTemplateMetrics();
    const suggestions = [];

    for (const metric of metrics) {
      // Low success rate
      if (metric.successRate < 0.8 && metric.usageCount > 10) {
        suggestions.push({
          templateId: metric.templateId,
          type: 'improve',
          reason: `Low success rate: ${(metric.successRate * 100).toFixed(1)}%`,
          potentialImprovement: 'Review template content and instructions'
        });
      }

      // Slow response time
      if (metric.averageResponseTime > 5000) {
        suggestions.push({
          templateId: metric.templateId,
          type: 'cache',
          reason: `Slow response time: ${metric.averageResponseTime}ms`,
          potentialImprovement: 'Cache template or optimize content'
        });
      }

      // High error rate
      if (metric.errorRate > 0.2) {
        suggestions.push({
          templateId: metric.templateId,
          type: 'improve',
          reason: `High error rate: ${(metric.errorRate * 100).toFixed(1)}%`,
          potentialImprovement: 'Fix errors in template logic'
        });
      }

      // Low usage for good template
      if (metric.usageCount < 5 && metric.successRate > 0.9 && metric.averageResponseTime < 2000) {
        suggestions.push({
          templateId: metric.templateId,
          type: 'promote',
          reason: 'Good performance but low usage',
          potentialImprovement: 'Improve triggers and keywords'
        });
      }

      // Deprecated template
      if (metric.usageCount === 0 && metric.lastUsed < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) {
        suggestions.push({
          templateId: metric.templateId,
          type: 'deprecate',
          reason: 'Not used in 90 days',
          potentialImprovement: 'Consider removing or updating'
        });
      }
    }

    return suggestions;
  }

  /**
   * Check template health and create alerts
   */
  private async checkTemplateHealth(templateId: string): Promise<void> {
    const metrics = await this.getTemplateMetrics({ limit: 1 });
    const template = metrics.find(m => m.templateId === templateId);

    if (!template) return;

    // Check for critical issues
    if (template.successRate < 0.5 && template.usageCount > 5) {
      await this.createAlert({
        type: 'critical',
        templateId,
        message: `Critical: Template success rate dropped to ${(template.successRate * 100).toFixed(1)}%`
      });
    }

    if (template.averageResponseTime > 10000) {
      await this.createAlert({
        type: 'warning',
        templateId,
        message: `Warning: Template response time is ${template.averageResponseTime}ms`
      });
    }
  }

  /**
   * Create alert for template issues
   */
  private async createAlert(alert: {
    type: 'critical' | 'warning' | 'info';
    templateId: string;
    message: string;
  }): Promise<void> {
    // Would store alerts in a separate table
    console.log(`ALERT [${alert.type.toUpperCase()}] ${alert.templateId}: ${alert.message}`);
  }

  /**
   * Calculate cost based on token usage
   */
  private calculateCost(tokens: number): number {
    // GPT-4o-mini pricing: $0.15 per 1M input tokens, $0.6 per 1M output tokens
    // Assuming 50/50 split for estimation
    return (tokens * 0.000375) / 1000000; // in USD
  }

  /**
   * Calculate satisfaction score
   */
  private calculateSatisfactionScore(template: any): number {
    // Would be based on user feedback
    return 0.85; // Placeholder
  }

  /**
   * Calculate popularity score
   */
  private calculatePopularityScore(analytics: any, metadata: any): number {
    const usageCount = analytics.usageCount || 0;
    const successRate = analytics.successRate || 1;
    const priority = metadata.priority || 5;

    // Weighted score
    return (usageCount * 0.6 + successRate * 30 + priority * 10) / 100;
  }

  /**
   * Get daily usage data
   */
  private async getDailyUsage(dateFrom: Date, dateTo: Date): Promise<Array<{ date: string; count: number }>> {
    const { data } = await supabase
      .from('optimized_document_generations')
      .select('created_at')
      .gte('created_at', dateFrom.toISOString())
      .lte('created_at', dateTo.toISOString());

    const dailyCounts = new Map<string, number>();
    data?.forEach(d => {
      const date = d.created_at.split('T')[0];
      dailyCounts.set(date, (dailyCounts.get(date) || 0) + 1);
    });

    return Array.from(dailyCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get response time trend
   */
  private async getResponseTimeTrend(dateFrom: Date, dateTo: Date): Promise<Array<{ date: string; avgTime: number }>> {
    const { data } = await supabase
      .from('optimized_document_generations')
      .select('created_at, processing_time_ms')
      .gte('created_at', dateFrom.toISOString())
      .lte('created_at', dateTo.toISOString());

    const dailyTimes = new Map<string, { total: number; count: number }>();
    data?.forEach(d => {
      const date = d.created_at.split('T')[0];
      if (!dailyTimes.has(date)) {
        dailyTimes.set(date, { total: 0, count: 0 });
      }
      const stats = dailyTimes.get(date)!;
      stats.total += d.processing_time_ms;
      stats.count++;
    });

    return Array.from(dailyTimes.entries())
      .map(([date, stats]) => ({
        date,
        avgTime: stats.total / stats.count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Generate optimization recommendations
   */
  private async generateRecommendations(): Promise<Array<{
    type: 'optimize' | 'promote' | 'deprecate' | 'investigate';
    templateId: string;
    message: string;
    impact: 'high' | 'medium' | 'low';
  }>> {
    const suggestions = await this.getOptimizationSuggestions();

    return suggestions.map(s => ({
      type: s.type as any,
      templateId: s.templateId,
      message: s.reason,
      impact: s.type === 'improve' ? 'high' : s.type === 'promote' ? 'medium' : 'low'
    }));
  }

  /**
   * Get template name
   */
  private async getTemplateName(templateId: string): Promise<string> {
    const { data } = await supabase
      .from('enhanced_templates')
      .select('name')
      .eq('template_id', templateId)
      .single();

    return data?.name || templateId;
  }

  /**
   * Get template category
   */
  private async getTemplateCategory(templateId: string): Promise<string> {
    const { data } = await supabase
      .from('enhanced_templates')
      .select('category')
      .eq('template_id', templateId)
      .single();

    return data?.category || 'unknown';
  }
}