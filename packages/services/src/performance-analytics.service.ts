/**
 * Performance Analytics Service
 *
 * Monitors and analyzes document generation performance,
 * providing insights for optimization and improvements.
 */

import { createClient } from '@supabase/supabase-js';

export interface PerformanceMetrics {
  timestamp: string;
  service: string;
  operation: string;
  duration: number;
  success: boolean;
  tokens?: number;
  templateId?: string;
  category?: string;
  confidence?: number;
  error?: string;
}

export interface AnalyticsDashboard {
  overview: {
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    totalTokensUsed: number;
    costEstimate: number;
  };
  performance: {
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    slowestOperations: Array<{
      operation: string;
      averageTime: number;
      count: number;
    }>;
  };
  templates: {
    mostUsed: Array<{
      templateId: string;
      name: string;
      usage: number;
      averageTime: number;
      successRate: number;
    }>;
    leastUsed: Array<{
      templateId: string;
      name: string;
      usage: number;
      averageTime: number;
    }>;
    byCategory: Record<string, {
      usage: number;
      averageTime: number;
      successRate: number;
    }>;
  };
  trends: {
    daily: Array<{
      date: string;
      requests: number;
      averageTime: number;
      successRate: number;
    }>;
    hourly: Array<{
      hour: number;
      requests: number;
      averageTime: number;
      successRate: number;
    }>;
  };
  errors: {
    frequentErrors: Array<{
      error: string;
      count: number;
      percentage: number;
    }>;
    errorRate: number;
  };
}

export class PerformanceAnalyticsService {
  private supabase;
  private metrics: PerformanceMetrics[] = [];
  private batchSize = 100;
  private flushInterval = 60000; // 1 minute
  private flushTimer?: NodeJS.Timeout;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.startBatchProcessor();
  }

  /**
   * Record performance metric
   */
  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Auto-flush if batch size reached
    if (this.metrics.length >= this.batchSize) {
      this.flushMetrics();
    }
  }

  /**
   * Get comprehensive analytics dashboard
   */
  async getDashboard(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<AnalyticsDashboard> {
    const dateRange = this.getDateRange(timeRange);

    try {
      // Fetch metrics from database
      const { data: dbMetrics, error } = await this.supabase
        .from('performance_metrics')
        .select('*')
        .gte('timestamp', dateRange.start)
        .lte('timestamp', dateRange.end)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Failed to fetch metrics:', error);
        return this.getEmptyDashboard();
      }

      const allMetrics = [...dbMetrics, ...this.metrics];

      return this.buildDashboard(allMetrics);

    } catch (error) {
      console.error('Analytics dashboard generation failed:', error);
      return this.getEmptyDashboard();
    }
  }

  /**
   * Get real-time performance metrics
   */
  getRealTimeMetrics(): {
    requestsPerMinute: number;
    averageResponseTime: number;
    successRate: number;
    activeTemplates: number;
  } {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    const recentMetrics = this.metrics.filter(m =>
      new Date(m.timestamp).getTime() > oneMinuteAgo
    );

    const requestsPerMinute = recentMetrics.length;
    const averageResponseTime = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
      : 0;

    const successRate = recentMetrics.length > 0
      ? recentMetrics.filter(m => m.success).length / recentMetrics.length
      : 0;

    const activeTemplates = new Set(
      recentMetrics.filter(m => m.templateId).map(m => m.templateId)
    ).size;

    return {
      requestsPerMinute,
      averageResponseTime,
      successRate,
      activeTemplates
    };
  }

  /**
   * Get template performance comparison
   */
  async getTemplateComparison(
    templateIds: string[],
    timeRange: '1h' | '24h' | '7d' | '30d' = '24h'
  ): Promise<Array<{
    templateId: string;
    name: string;
    usage: number;
    averageTime: number;
    successRate: number;
    costPerUse: number;
    efficiency: number;
  }>> {
    const dateRange = this.getDateRange(timeRange);

    try {
      const { data: metrics, error } = await this.supabase
        .from('performance_metrics')
        .select('*')
        .in('template_id', templateIds)
        .gte('timestamp', dateRange.start)
        .lte('timestamp', dateRange.end);

      if (error || !metrics) {
        return [];
      }

      const templateStats = new Map();

      metrics.forEach(metric => {
        const existing = templateStats.get(metric.template_id) || {
          templateId: metric.template_id,
          totalDuration: 0,
          count: 0,
          successes: 0,
          totalTokens: 0
        };

        existing.totalDuration += metric.duration;
        existing.count += 1;
        if (metric.success) existing.successes += 1;
        if (metric.tokens) existing.totalTokens += metric.tokens;

        templateStats.set(metric.template_id, existing);
      });

      return Array.from(templateStats.values()).map(stat => ({
        templateId: stat.templateId,
        name: this.formatTemplateName(stat.templateId),
        usage: stat.count,
        averageTime: stat.totalDuration / stat.count,
        successRate: stat.successes / stat.count,
        costPerUse: this.calculateCostPerUse(stat.totalTokens / stat.count),
        efficiency: this.calculateEfficiency(stat.totalDuration / stat.count, stat.successes / stat.count)
      })).sort((a, b) => b.efficiency - a.efficiency);

    } catch (error) {
      console.error('Template comparison failed:', error);
      return [];
    }
  }

  /**
   * Get performance insights and recommendations
   */
  async getPerformanceInsights(): Promise<{
    recommendations: string[];
    warnings: string[];
    optimizations: Array<{
      area: string;
      impact: 'high' | 'medium' | 'low';
      description: string;
      estimatedImprovement: string;
    }>;
  }> {
    const dashboard = await this.getDashboard('24h');
    const insights = {
      recommendations: [] as string[],
      warnings: [] as string[],
      optimizations: [] as Array<{
        area: string;
        impact: 'high' | 'medium' | 'low';
        description: string;
        estimatedImprovement: string;
      }>
    };

    // Analyze response times
    if (dashboard.performance.averageResponseTime > 5000) {
      insights.warnings.push('Average response time is above 5 seconds');
      insights.optimizations.push({
        area: 'Response Time',
        impact: 'high',
        description: 'Consider implementing template pre-loading and instruction caching',
        estimatedImprovement: '30-50% faster response times'
      });
    }

    // Analyze success rates
    if (dashboard.overview.successRate < 0.95) {
      insights.warnings.push('Success rate is below 95%');
      insights.recommendations.push('Review error logs and implement better error handling');
    }

    // Analyze template usage
    if (dashboard.templates.leastUsed.length > 5) {
      insights.optimizations.push({
        area: 'Template Optimization',
        impact: 'medium',
        description: 'Several templates have very low usage - consider consolidation or removal',
        estimatedImprovement: 'Reduced cognitive load and maintenance'
      });
    }

    // Analyze errors
    if (dashboard.errors.errorRate > 0.05) {
      insights.warnings.push('Error rate is above 5%');
      insights.recommendations.push('Investigate frequent errors and implement fixes');
    }

    // Performance recommendations
    if (dashboard.performance.p95ResponseTime > 8000) {
      insights.optimizations.push({
        area: 'Performance',
        impact: 'high',
        description: 'P95 response times are high - implement request timeouts and fallbacks',
        estimatedImprovement: 'Better user experience and reliability'
      });
    }

    return insights;
  }

  /**
   * Build analytics dashboard from metrics
   */
  private buildDashboard(metrics: PerformanceMetrics[]): AnalyticsDashboard {
    if (metrics.length === 0) {
      return this.getEmptyDashboard();
    }

    const totalRequests = metrics.length;
    const successCount = metrics.filter(m => m.success).length;
    const successRate = successCount / totalRequests;
    const averageResponseTime = metrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests;
    const totalTokens = metrics.reduce((sum, m) => sum + (m.tokens || 0), 0);

    // Calculate percentiles
    const sortedTimes = metrics.map(m => m.duration).sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);

    return {
      overview: {
        totalRequests,
        successRate,
        averageResponseTime,
        totalTokensUsed: totalTokens,
        costEstimate: this.calculateCost(totalTokens)
      },
      performance: {
        averageResponseTime,
        p95ResponseTime: sortedTimes[p95Index] || 0,
        p99ResponseTime: sortedTimes[p99Index] || 0,
        slowestOperations: this.getSlowestOperations(metrics)
      },
      templates: {
        mostUsed: this.getMostUsedTemplates(metrics),
        leastUsed: this.getLeastUsedTemplates(metrics),
        byCategory: this.getUsageByCategory(metrics)
      },
      trends: {
        daily: this.getDailyTrends(metrics),
        hourly: this.getHourlyTrends(metrics)
      },
      errors: {
        frequentErrors: this.getFrequentErrors(metrics),
        errorRate: 1 - successRate
      }
    };
  }

  /**
   * Get empty dashboard for error cases
   */
  private getEmptyDashboard(): AnalyticsDashboard {
    return {
      overview: {
        totalRequests: 0,
        successRate: 0,
        averageResponseTime: 0,
        totalTokensUsed: 0,
        costEstimate: 0
      },
      performance: {
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        slowestOperations: []
      },
      templates: {
        mostUsed: [],
        leastUsed: [],
        byCategory: {}
      },
      trends: {
        daily: [],
        hourly: []
      },
      errors: {
        frequentErrors: [],
        errorRate: 0
      }
    };
  }

  /**
   * Get date range for queries
   */
  private getDateRange(timeRange: '1h' | '24h' | '7d' | '30d'): { start: string; end: string } {
    const now = new Date();
    const start = new Date();

    switch (timeRange) {
      case '1h':
        start.setHours(now.getHours() - 1);
        break;
      case '24h':
        start.setDate(now.getDate() - 1);
        break;
      case '7d':
        start.setDate(now.getDate() - 7);
        break;
      case '30d':
        start.setDate(now.getDate() - 30);
        break;
    }

    return {
      start: start.toISOString(),
      end: now.toISOString()
    };
  }

  /**
   * Batch process metrics and save to database
   */
  private async flushMetrics(): Promise<void> {
    if (this.metrics.length === 0) return;

    try {
      const metricsToSave = [...this.metrics];
      this.metrics = [];

      const { error } = await this.supabase
        .from('performance_metrics')
        .insert(metricsToSave);

      if (error) {
        console.error('Failed to save performance metrics:', error);
        // Re-add metrics to try again later
        this.metrics.unshift(...metricsToSave);
      } else {
        console.log(`Saved ${metricsToSave.length} performance metrics`);
      }

    } catch (error) {
      console.error('Metrics flush failed:', error);
    }
  }

  /**
   * Start automatic batch processor
   */
  private startBatchProcessor(): void {
    this.flushTimer = setInterval(() => {
      this.flushMetrics();
    }, this.flushInterval);

    // Cleanup on process exit
    process.on('SIGINT', () => {
      this.flushMetrics().then(() => {
        process.exit(0);
      });
    });
  }

  // Helper methods for dashboard calculations
  private getSlowestOperations(metrics: PerformanceMetrics[]) {
    const operationTimes = new Map();

    metrics.forEach(metric => {
      const existing = operationTimes.get(metric.operation) || {
        totalTime: 0,
        count: 0
      };

      existing.totalTime += metric.duration;
      existing.count += 1;
      operationTimes.set(metric.operation, existing);
    });

    return Array.from(operationTimes.entries())
      .map(([operation, stats]) => ({
        operation,
        averageTime: stats.totalTime / stats.count,
        count: stats.count
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);
  }

  private getMostUsedTemplates(metrics: PerformanceMetrics[]) {
    const templateUsage = new Map();

    metrics.forEach(metric => {
      if (metric.templateId) {
        templateUsage.set(metric.templateId, (templateUsage.get(metric.templateId) || 0) + 1);
      }
    });

    return Array.from(templateUsage.entries())
      .map(([templateId, usage]) => ({
        templateId,
        name: this.formatTemplateName(templateId),
        usage,
        averageTime: 0,
        successRate: 0
      }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10);
  }

  private getLeastUsedTemplates(metrics: PerformanceMetrics[]) {
    // Similar implementation for least used templates
    return [];
  }

  private getUsageByCategory(metrics: PerformanceMetrics[]) {
    const categoryUsage = new Map();

    metrics.forEach(metric => {
      if (metric.category) {
        const existing = categoryUsage.get(metric.category) || {
          usage: 0,
          totalTime: 0,
          successes: 0
        };

        existing.usage += 1;
        existing.totalTime += metric.duration;
        if (metric.success) existing.successes += 1;

        categoryUsage.set(metric.category, existing);
      }
    });

    const result: Record<string, any> = {};
    categoryUsage.forEach((stats, category) => {
      result[category] = {
        usage: stats.usage,
        averageTime: stats.totalTime / stats.usage,
        successRate: stats.successes / stats.usage
      };
    });

    return result;
  }

  private getDailyTrends(metrics: PerformanceMetrics[]) {
    // Implementation for daily trends
    return [];
  }

  private getHourlyTrends(metrics: PerformanceMetrics[]) {
    // Implementation for hourly trends
    return [];
  }

  private getFrequentErrors(metrics: PerformanceMetrics[]) {
    const errorCounts = new Map();

    metrics.forEach(metric => {
      if (!metric.success && metric.error) {
        errorCounts.set(metric.error, (errorCounts.get(metric.error) || 0) + 1);
      }
    });

    const totalErrors = Array.from(errorCounts.values()).reduce((sum, count) => sum + count, 0);

    return Array.from(errorCounts.entries())
      .map(([error, count]) => ({
        error,
        count,
        percentage: (count / totalErrors) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private formatTemplateName(templateId: string): string {
    return templateId.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private calculateCost(tokens: number): number {
    // GPT-4o-mini pricing: $0.15 per 1M input tokens, $0.6 per 1M output tokens
    const inputCost = (tokens * 0.6) / 1000000; // Assume 60% input tokens
    const outputCost = (tokens * 0.4) / 1000000 * 0.6; // 40% output tokens
    return inputCost + outputCost;
  }

  private calculateCostPerUse(averageTokens: number): number {
    return this.calculateCost(averageTokens);
  }

  private calculateEfficiency(averageTime: number, successRate: number): number {
    // Efficiency score: lower time and higher success rate = higher efficiency
    const timeScore = Math.max(0, 1 - (averageTime / 10000)); // Normalize to 0-1
    return (timeScore * 0.6) + (successRate * 0.4); // Weighted average
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flushMetrics();
  }
}