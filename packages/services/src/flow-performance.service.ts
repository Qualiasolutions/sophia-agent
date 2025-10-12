/**
 * Flow Performance Service
 * Tracks and analyzes flow performance metrics
 */

import { createClient } from '@supabase/supabase-js';

export interface FlowMetrics {
  flowId: string;
  templateId: string;
  totalSessions: number;
  completedSessions: number;
  abandonedSessions: number;
  averageStepsToComplete: number;
  averageTimeToComplete: number;
  completionRate: number;
  dropoffPoints: Array<{
    stepId: string;
    dropoffCount: number;
    dropoffRate: number;
  }>;
  timeByStep: Array<{
    stepId: string;
    stepName: string;
    averageTimeSpent: number;
  }>;
  lastUpdated: Date;
}

export interface FlowSessionEvent {
  sessionId: string;
  flowId: string;
  templateId: string;
  stepId: string;
  eventType: 'step_start' | 'step_complete' | 'flow_complete' | 'flow_abandon';
  timestamp: Date;
  timeSpent?: number;
  metadata?: Record<string, any>;
}

export class FlowPerformanceService {
  private readonly metricsCache = new Map<string, FlowMetrics>();
  private readonly cacheTTL = 5 * 60 * 1000; // 5 minutes
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Record a flow event
   */
  async recordEvent(event: FlowSessionEvent): Promise<void> {
    // Store in database
    await this.supabase
      .from('flow_performance_events')
      .insert({
        session_id: event.sessionId,
        flow_id: event.flowId,
        template_id: event.templateId,
        step_id: event.stepId,
        event_type: event.eventType,
        timestamp: event.timestamp.toISOString(),
        time_spent: event.timeSpent,
        metadata: event.metadata
      });

    // Update session tracking
    if (event.eventType === 'flow_complete') {
      await this.supabase
        .from('document_request_sessions')
        .update({
          status: 'completed',
          completed_at: event.timestamp.toISOString()
        })
        .eq('id', event.sessionId);
    } else if (event.eventType === 'flow_abandon') {
      await this.supabase
        .from('document_request_sessions')
        .update({
          status: 'abandoned',
          abandoned_at: event.timestamp.toISOString()
        })
        .eq('id', event.sessionId);
    }

    // Invalidate cache
    this.metricsCache.delete(event.flowId);
  }

  /**
   * Get flow performance metrics
   */
  async getFlowMetrics(flowId: string): Promise<FlowMetrics | null> {
    // Check cache
    const cached = this.metricsCache.get(flowId);
    if (cached && Date.now() - new Date(cached.lastUpdated).getTime() < this.cacheTTL) {
      return cached;
    }

    // Fetch from database
    const { data: events, error } = await this.supabase
      .from('flow_performance_events')
      .select('*')
      .eq('flow_id', flowId)
      .order('timestamp', { ascending: true });

    if (error || !events || events.length === 0) {
      return null;
    }

    // Calculate metrics
    const sessions = new Set(events.map((e: any) => e.session_id));
    const sessionsByStep = new Map<string, Set<string>>();
    const stepTimes = new Map<string, number[]>();
    const dropoffByStep = new Map<string, number>();

    // Process events
    events.forEach((event: any) => {
      if (!sessionsByStep.has(event.step_id)) {
        sessionsByStep.set(event.step_id, new Set());
      }
      sessionsByStep.get(event.step_id)!.add(event.session_id);

      if (event.time_spent) {
        if (!stepTimes.has(event.step_id)) {
          stepTimes.set(event.step_id, []);
        }
        stepTimes.get(event.step_id)!.push(event.time_spent);
      }

      if (event.event_type === 'flow_abandon') {
        dropoffByStep.set(
          event.step_id,
          (dropoffByStep.get(event.step_id) || 0) + 1
        );
      }
    });

    // Calculate completion metrics
    const completedSessions = events.filter((e: any) => e.event_type === 'flow_complete')
      .map((e: any) => e.session_id);
    const completionRate = (completedSessions.length / sessions.size) * 100;

    // Calculate dropoff points
    const dropoffPoints = Array.from(dropoffByStep.entries())
      .map(([stepId, dropoffCount]) => ({
        stepId,
        dropoffCount,
        dropoffRate: (dropoffCount / (sessionsByStep.get(stepId)?.size || 1)) * 100
      }))
      .sort((a, b) => b.dropoffRate - a.dropoffRate);

    // Calculate time by step
    const timeByStep = Array.from(stepTimes.entries())
      .map(([stepId, times]) => ({
        stepId,
        stepName: stepId, // Would need to fetch from flow definition
        averageTimeSpent: times.reduce((a, b) => a + b, 0) / times.length
      }));

    const metrics: FlowMetrics = {
      flowId,
      templateId: events[0]?.template_id || '',
      totalSessions: sessions.size,
      completedSessions: completedSessions.length,
      abandonedSessions: sessions.size - completedSessions.length,
      averageStepsToComplete: this.calculateAverageSteps(events, completedSessions),
      averageTimeToComplete: this.calculateAverageTime(events, completedSessions),
      completionRate,
      dropoffPoints,
      timeByStep,
      lastUpdated: new Date()
    };

    // Cache results
    this.metricsCache.set(flowId, metrics);

    return metrics;
  }

  /**
   * Get template performance summary
   */
  async getTemplatePerformanceSummary(templateId: string): Promise<{
    totalFlows: number;
    totalSessions: number;
    averageCompletionRate: number;
    topPerformingFlows: string[];
    problemFlows: string[];
  }> {
    const { data: flows, error } = await this.supabase
      .from('enhanced_templates')
      .select('template_id, flow')
      .eq('template_id', templateId)
      .not('flow', 'is', null);

    if (error || !flows || flows.length === 0) {
      return {
        totalFlows: 0,
        totalSessions: 0,
        averageCompletionRate: 0,
        topPerformingFlows: [],
        problemFlows: []
      };
    }

    const flowMetrics = await Promise.all(
      flows.map((flow: any) => this.getFlowMetrics(flow.template_id))
    );

    const validMetrics = flowMetrics.filter(m => m !== null) as FlowMetrics[];
    const totalSessions = validMetrics.reduce((sum, m) => sum + m.totalSessions, 0);
    const averageCompletionRate = validMetrics.reduce((sum, m) => sum + m.completionRate, 0) / validMetrics.length;

    const topPerformingFlows = validMetrics
      .filter(m => m.completionRate > 80)
      .map(m => m.flowId);

    const problemFlows = validMetrics
      .filter(m => m.completionRate < 50)
      .map(m => m.flowId);

    return {
      totalFlows: flows.length,
      totalSessions,
      averageCompletionRate,
      topPerformingFlows,
      problemFlows
    };
  }

  /**
   * Get system-wide performance dashboard
   */
  async getPerformanceDashboard(): Promise<{
    totalActiveFlows: number;
    totalSessionsToday: number;
    averageCompletionRate: number;
    flowsWithIssues: string[];
    recentTrends: Array<{
      date: string;
      sessions: number;
      completionRate: number;
    }>;
  }> {
    // Get today's sessions
    const today = new Date().toISOString().split('T')[0]!;
    const { data: todaySessions } = await this.supabase
      .from('document_request_sessions')
      .select('*')
      .gte('created_at', today);

    // Get all flows with performance data
    const { data: templates } = await this.supabase
      .from('enhanced_templates')
      .select('template_id')
      .not('flow', 'is', null);

    const flowMetrics = await Promise.all(
      (templates || []).map((t: any) => this.getFlowMetrics(t.template_id))
    );

    const validMetrics = flowMetrics.filter(m => m !== null) as FlowMetrics[];
    const flowsWithIssues = validMetrics
      .filter(m => m.completionRate < 50 || m.abandonedSessions > m.totalSessions * 0.3)
      .map(m => m.flowId);

    // Calculate trends for last 7 days
    const trends: Array<{
      date: string;
      sessions: number;
      completionRate: number;
    }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0]!;

      const { data: daySessions } = await this.supabase
        .from('document_request_sessions')
        .select('*')
        .eq('date(created_at)', dateStr);

      const completed = daySessions?.filter((s: any) => s.status === 'completed').length || 0;
      const total = daySessions?.length || 0;

      trends.push({
        date: dateStr,
        sessions: total,
        completionRate: total > 0 ? (completed / total) * 100 : 0
      });
    }

    return {
      totalActiveFlows: validMetrics.length,
      totalSessionsToday: todaySessions?.length || 0,
      averageCompletionRate: validMetrics.length > 0
        ? validMetrics.reduce((sum, m) => sum + m.completionRate, 0) / validMetrics.length
        : 0,
      flowsWithIssues,
      recentTrends: trends
    };
  }

  /**
   * Send performance alerts
   */
  async checkAndSendAlerts(): Promise<void> {
    const dashboard = await this.getPerformanceDashboard();

    // Check for critical issues
    if (dashboard.averageCompletionRate < 50) {
      await this.sendAlert({
        type: 'critical',
        message: `System-wide completion rate dropped to ${dashboard.averageCompletionRate.toFixed(1)}%`,
        flows: dashboard.flowsWithIssues
      });
    }

    // Check individual problematic flows
    for (const flowId of dashboard.flowsWithIssues) {
      const metrics = await this.getFlowMetrics(flowId);
      if (metrics && metrics.completionRate < 30) {
        await this.sendAlert({
          type: 'warning',
          message: `Flow ${flowId} has very low completion rate: ${metrics.completionRate.toFixed(1)}%`,
          flowId,
          dropoffPoint: metrics.dropoffPoints[0]?.stepId
        });
      }
    }
  }

  /**
   * Helper methods
   */
  private calculateAverageSteps(events: any[], completedSessions: string[]): number {
    const stepCounts = completedSessions.map(sessionId => {
      return events.filter((e: any) => e.session_id === sessionId && e.event_type === 'step_complete').length;
    });
    return stepCounts.reduce((a, b) => a + b, 0) / stepCounts.length;
  }

  private calculateAverageTime(events: any[], completedSessions: string[]): number {
    const times = completedSessions.map(sessionId => {
      const sessionEvents = events.filter((e: any) => e.session_id === sessionId);
      const start = sessionEvents[0]?.timestamp;
      const end = sessionEvents.find((e: any) => e.event_type === 'flow_complete')?.timestamp;
      return start && end ? new Date(end).getTime() - new Date(start).getTime() : 0;
    }).filter((t: number) => t > 0);

    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  private async sendAlert(alert: {
    type: 'critical' | 'warning';
    message: string;
    flowId?: string;
    flows?: string[];
    dropoffPoint?: string;
  }): Promise<void> {
    console.error(`[FLOW ALERT - ${alert.type.toUpperCase()}] ${alert.message}`);

    // In production, send to monitoring service
    // await this.monitoringService.sendAlert(alert);
  }
}