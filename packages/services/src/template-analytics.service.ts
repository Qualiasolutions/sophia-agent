/**
 * Template Performance Analytics Service
 *
 * Tracks usage patterns, performance metrics, and generates insights
 * for continuous optimization of the template system
 */

import { createClient } from '@supabase/supabase-js';

export interface TemplateUsageMetrics {
  templateId: string;
  templateName: string;
  category: string;
  usageCount: number;
  successRate: number;
  averageResponseTime: number;
  averageTokensUsed: number;
  lastUsed: Date;
  totalRevenue?: number;
  costPerGeneration?: number;
  trendDirection: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface PerformanceInsight {
  type: 'slow_template' | 'low_success' | 'high_usage' | 'unused' | 'expensive';
  templateId: string;
  templateName: string;
  value: number;
  benchmark: number;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AnalyticsSummary {
  period: string;
  totalGenerations: number;
  averageResponseTime: number;
  successRate: number;
  totalCost: number;
  topTemplates: Array<{
    templateId: string;
    name: string;
    count: number;
    percentage: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  insights: PerformanceInsight[];
}

export class TemplateAnalyticsService {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Record template usage
   */
  async recordUsage(
    templateId: string,
    metrics: {
      responseTime: number;
      tokensUsed: number;
      success: boolean;
      confidence?: number;
      cacheHit?: boolean;
      matchType?: 'semantic' | 'keyword' | 'hybrid';
    }
  ): Promise<void> {
    try {
      // Update template analytics in enhanced_templates
      await this.supabase.rpc('update_template_analytics', {
        p_template_id: templateId,
        p_usage_count_increment: 1,
        p_success: metrics.success,
        p_response_time: metrics.responseTime
      });

      // Log detailed usage in optimized_document_generations
      await this.supabase
        .from('optimized_document_generations')
        .insert({
          template_id: templateId,
          processing_time_ms: metrics.responseTime,
          tokens_used: metrics.tokensUsed,
          success: metrics.success,
          confidence: metrics.confidence || 0.95,
          cache_hit: metrics.cacheHit || false,
          metadata: {
            match_type: metrics.matchType,
            recorded_at: new Date().toISOString()
          },
          created_at: new Date()
        });

    } catch (error) {
      console.error('Error recording template usage:', error);
    }
  }

  /**
   * Get comprehensive analytics for a template
   */
  async getTemplateAnalytics(
    templateId: string,
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<TemplateUsageMetrics | null> {
    try {
      // Get base analytics from enhanced_templates
      const { data: template, error: templateError } = await this.supabase
        .from('enhanced_templates')
        .select('template_id, name, category, analytics')
        .eq('template_id', templateId)
        .single();

      if (templateError || !template) {
        return null;
      }

      // Calculate period-specific metrics
      const { data: usage } = await this.supabase
        .from('optimized_document_generations')
        .select('processing_time_ms, tokens_used, success, created_at')
        .eq('template_id', templateId)
        .gte('created_at', this.getPeriodStart(period))
        .order('created_at', { ascending: false });

      const recentUsage = usage || [];
      const totalUsage = template.analytics?.usageCount || 0;

      // Calculate trends
      const { direction, percentage } = await this.calculateTrend(
        templateId,
        recentUsage.length,
        period
      );

      return {
        templateId: template.template_id,
        templateName: template.name,
        category: template.category,
        usageCount: totalUsage,
        successRate: template.analytics?.successRate || 0,
        averageResponseTime: template.analytics?.averageResponseTime || 0,
        averageTokensUsed: this.calculateAverage(recentUsage, 'tokens_used'),
        lastUsed: new Date(template.analytics?.lastUsed || Date.now()),
        costPerGeneration: this.calculateCostPerGeneration(recentUsage),
        trendDirection: direction,
        trendPercentage: percentage
      };

    } catch (error) {
      console.error('Error getting template analytics:', error);
      return null;
    }
  }

  /**
   * Get analytics summary for dashboard
   */
  async getAnalyticsSummary(
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<AnalyticsSummary> {
    try {
      const startDate = this.getPeriodStart(period);

      // Get total generations
      const { count: totalGenerations } = await this.supabase
        .from('optimized_document_generations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate);

      // Calculate average metrics
      const { data: metrics } = await this.supabase
        .from('optimized_document_generations')
        .select('processing_time_ms, tokens_used, success')
        .gte('created_at', startDate);

      const avgResponseTime = metrics?.length > 0
        ? metrics.reduce((sum: number, m: any) => sum + m.processing_time_ms, 0) / metrics.length
        : 0;

      const successRate = metrics?.length > 0
        ? (metrics.filter((m: any) => m.success).length / metrics.length) * 100
        : 0;

      const totalCost = this.calculateTotalCost(metrics || []);

      // Get top templates
      const { data: topTemplatesData } = await this.supabase
        .from('optimized_document_generations')
        .select('template_id')
        .gte('created_at', startDate);

      const templateCounts = this.aggregateTemplateCounts(topTemplatesData || []);

      // Get template names
      const { data: templateInfo } = await this.supabase
        .from('enhanced_templates')
        .select('template_id, name, category')
        .in('template_id', templateCounts.map(t => t.templateId));

      const topTemplates = templateCounts
        .slice(0, 5)
        .map(t => ({
          templateId: t.templateId,
          name: templateInfo?.find((ti: any) => ti.template_id === t.templateId)?.name || t.templateId,
          count: t.count,
          percentage: totalGenerations > 0 ? (t.count / totalGenerations) * 100 : 0
        }));

      // Get category breakdown
      const categoryData = templateInfo || [];

      const categoryBreakdown = this.aggregateCategoryBreakdown(
        categoryData || [],
        templateCounts,
        totalGenerations
      );

      // Generate insights
      const insights = await this.generateInsights(metrics || [], period);

      return {
        period,
        totalGenerations: totalGenerations || 0,
        averageResponseTime: Math.round(avgResponseTime),
        successRate: Math.round(successRate * 100) / 100,
        totalCost,
        topTemplates,
        categoryBreakdown,
        insights
      };

    } catch (error) {
      console.error('Error getting analytics summary:', error);
      return {
        period,
        totalGenerations: 0,
        averageResponseTime: 0,
        successRate: 0,
        totalCost: 0,
        topTemplates: [],
        categoryBreakdown: [],
        insights: []
      };
    }
  }

  /**
   * Get performance insights
   */
  async getPerformanceInsights(): Promise<PerformanceInsight[]> {
    const insights: PerformanceInsight[] = [];

    try {
      // Get all enhanced templates
      const { data: templates } = await this.supabase
        .from('enhanced_templates')
        .select('template_id, name, category, analytics, metadata');

      if (!templates) return insights;

      const avgResponseTime = 2000; // 2 seconds benchmark
      const minSuccessRate = 0.90; // 90% benchmark
      const minUsage = 5; // Minimum usage per month

      // Check slow templates
      templates.forEach((template: any) => {
        const responseTime = template.analytics?.averageResponseTime || 0;
        const successRate = template.analytics?.successRate || 0;
        const usageCount = template.analytics?.usageCount || 0;

        // Slow templates
        if (responseTime > avgResponseTime * 1.5) {
          insights.push({
            type: 'slow_template',
            templateId: template.template_id,
            templateName: template.name,
            value: responseTime,
            benchmark: avgResponseTime,
            recommendation: `Template is ${Math.round((responseTime / avgResponseTime - 1) * 100)}% slower than average. Consider optimizing content or adding caching.`,
            priority: responseTime > avgResponseTime * 2 ? 'high' : 'medium'
          });
        }

        // Low success rate
        if (successRate < minSuccessRate && usageCount > 10) {
          insights.push({
            type: 'low_success',
            templateId: template.template_id,
            templateName: template.name,
            value: successRate * 100,
            benchmark: minSuccessRate * 100,
            recommendation: `Success rate is ${Math.round((minSuccessRate - successRate) * 100)}% below target. Review template instructions or field validation.`,
            priority: successRate < 0.8 ? 'high' : 'medium'
          });
        }

        // High usage templates (optimize these first)
        if (usageCount > 50) {
          insights.push({
            type: 'high_usage',
            templateId: template.template_id,
            templateName: template.name,
            value: usageCount,
            benchmark: 20,
            recommendation: `High usage template. Consider pre-caching and regular optimization to maintain performance.`,
            priority: 'low'
          });
        }

        // Unused templates
        if (usageCount === 0 && template.metadata?.priority > 5) {
          insights.push({
            type: 'unused',
            templateId: template.template_id,
            templateName: template.name,
            value: 0,
            benchmark: minUsage,
            recommendation: `Template not used in current period. Check if triggers are working or if template is still relevant.`,
            priority: 'medium'
          });
        }
      });

      // Sort by priority
      insights.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

    } catch (error) {
      console.error('Error generating insights:', error);
    }

    return insights;
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(
    format: 'json' | 'csv' = 'json',
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<string> {
    const summary = await this.getAnalyticsSummary(period);
    const templates = await this.getAllTemplateMetrics(period);

    const exportData = {
      summary,
      templates,
      insights: summary.insights,
      exportedAt: new Date().toISOString()
    };

    if (format === 'csv') {
      return this.convertToCSV(exportData);
    }

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Get metrics for all templates
   */
  private async getAllTemplateMetrics(
    period: 'day' | 'week' | 'month' | 'year'
  ): Promise<TemplateUsageMetrics[]> {
    const { data: templates } = await this.supabase
      .from('enhanced_templates')
      .select('template_id, name, category, analytics');

    if (!templates) return [];

    const metrics: TemplateUsageMetrics[] = [];

    for (const template of templates) {
      const usageMetrics = await this.getTemplateAnalytics(template.template_id, period);
      if (usageMetrics) {
        metrics.push(usageMetrics);
      }
    }

    return metrics.sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * Calculate trend direction and percentage
   */
  private async calculateTrend(
    templateId: string,
    currentUsage: number,
    period: 'day' | 'week' | 'month' | 'year'
  ): Promise<{ direction: 'up' | 'down' | 'stable'; percentage: number }> {
    // Get previous period usage for comparison
    const previousPeriodStart = this.getPeriodStart(period, 1);
    const currentPeriodStart = this.getPeriodStart(period, 0);

    const { count: previousUsage } = await this.supabase
      .from('optimized_document_generations')
      .select('*', { count: 'exact', head: true })
      .eq('template_id', templateId)
      .gte('created_at', previousPeriodStart)
      .lt('created_at', currentPeriodStart);

    if (!previousUsage || previousUsage === 0) {
      return { direction: 'stable', percentage: 0 };
    }

    const changePercentage = ((currentUsage - previousUsage) / previousUsage) * 100;

    if (Math.abs(changePercentage) < 10) {
      return { direction: 'stable', percentage: Math.abs(changePercentage) };
    }

    return {
      direction: changePercentage > 0 ? 'up' : 'down',
      percentage: Math.abs(changePercentage)
    };
  }

  /**
   * Calculate average value from array
   */
  private calculateAverage(data: any[], field: string): number {
    if (!data || data.length === 0) return 0;
    const sum = data.reduce((acc, item) => acc + (item[field] || 0), 0);
    return Math.round(sum / data.length);
  }

  /**
   * Calculate cost per generation
   */
  private calculateCostPerGeneration(usage: any[]): number {
    const avgTokens = this.calculateAverage(usage, 'tokens_used');
    // GPT-4o-mini: $0.00015 / 1K tokens (input) + $0.0006 / 1K tokens (output)
    // Assume 60% input, 40% output
    const costPerToken = 0.00015 * 0.6 + 0.0006 * 0.4;
    return (avgTokens / 1000) * costPerToken;
  }

  /**
   * Calculate total cost
   */
  private calculateTotalCost(metrics: any[]): number {
    const totalTokens = metrics.reduce((sum, m) => sum + (m.tokens_used || 0), 0);
    // GPT-4o-mini pricing
    const costPerToken = 0.00015 * 0.6 + 0.0006 * 0.4;
    return (totalTokens / 1000) * costPerToken;
  }

  /**
   * Get period start date
   */
  private getPeriodStart(period: 'day' | 'week' | 'month' | 'year', periodsBack = 0): Date {
    const now = new Date();
    const start = new Date(now);

    switch (period) {
      case 'day':
        start.setDate(now.getDate() - periodsBack);
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - (periodsBack * 7));
        start.setHours(0, 0, 0, 0);
        break;
      case 'month':
        start.setMonth(now.getMonth() - periodsBack);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - periodsBack);
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        break;
    }

    return start;
  }

  /**
   * Aggregate template counts
   */
  private aggregateTemplateCounts(data: Array<{ template_id: string }>): Array<{ templateId: string; count: number }> {
    const counts: Record<string, number> = {};

    data.forEach(item => {
      counts[item.template_id] = (counts[item.template_id] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([templateId, count]) => ({ templateId, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Aggregate category breakdown
   */
  private aggregateCategoryBreakdown(
    categories: Array<{ template_id: string; category: string }>,
    templateCounts: Array<{ templateId: string; count: number }>,
    total: number
  ): Array<{ category: string; count: number; percentage: number }> {
    const categoryTotals: Record<string, number> = {};

    templateCounts.forEach(tc => {
      const category = categories.find((c: any) => c.template_id === tc.templateId)?.category || 'unknown';
      categoryTotals[category] = (categoryTotals[category] || 0) + tc.count;
    });

    return Object.entries(categoryTotals)
      .map(([category, count]) => ({
        category,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Generate performance insights
   */
  private async generateInsights(
    metrics: any[],
    _period: 'day' | 'week' | 'month' | 'year'
  ): Promise<PerformanceInsight[]> {
    const insights: PerformanceInsight[] = [];

    if (metrics.length === 0) return insights;

    // Calculate benchmarks
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.processing_time_ms, 0) / metrics.length;
    const successRate = metrics.filter(m => m.success).length / metrics.length;

    // Response time insights
    if (avgResponseTime > 3000) {
      insights.push({
        type: 'slow_template',
        templateId: 'system',
        templateName: 'Overall System',
        value: avgResponseTime,
        benchmark: 2000,
        recommendation: `Average response time is ${Math.round((avgResponseTime / 2000 - 1) * 100)}% above target. Consider optimizing slow templates.`,
        priority: 'medium'
      });
    }

    // Success rate insights
    if (successRate < 0.95) {
      insights.push({
        type: 'low_success',
        templateId: 'system',
        templateName: 'Overall System',
        value: successRate * 100,
        benchmark: 95,
        recommendation: `Success rate is ${Math.round((0.95 - successRate) * 100)}% below target. Review error logs for common failures.`,
        priority: 'high'
      });
    }

    return insights;
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: any): string {
    const headers = [
      'Template ID',
      'Template Name',
      'Category',
      'Usage Count',
      'Success Rate',
      'Avg Response Time',
      'Last Used',
      'Trend'
    ];

    const rows = data.templates.map((t: TemplateUsageMetrics) => [
      t.templateId,
      t.templateName,
      t.category,
      t.usageCount,
      `${(t.successRate * 100).toFixed(1)}%`,
      `${t.averageResponseTime}ms`,
      t.lastUsed.toISOString().split('T')[0],
      `${t.trendDirection} ${t.trendPercentage.toFixed(1)}%`
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}