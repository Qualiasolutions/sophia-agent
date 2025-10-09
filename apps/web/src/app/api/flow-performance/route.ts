/**
 * Flow Performance Analytics API
 * Provides performance metrics for document flows
 */

import { NextRequest, NextResponse } from 'next/server';
import { FlowPerformanceService } from '@sophiaai/services';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const flowId = searchParams.get('flowId');
    const templateId = searchParams.get('templateId');
    const dashboard = searchParams.get('dashboard') === 'true';

    const performanceService = new FlowPerformanceService();

    if (dashboard) {
      // Get system-wide performance dashboard
      const dashboardData = await performanceService.getPerformanceDashboard();
      return NextResponse.json({ dashboard: dashboardData });
    }

    if (flowId) {
      // Get specific flow metrics
      const metrics = await performanceService.getFlowMetrics(flowId);
      if (!metrics) {
        return NextResponse.json(
          { error: 'Flow not found or no data available' },
          { status: 404 }
        );
      }
      return NextResponse.json({ metrics });
    }

    if (templateId) {
      // Get template performance summary
      const summary = await performanceService.getTemplatePerformanceSummary(templateId);
      return NextResponse.json({ summary });
    }

    return NextResponse.json(
      { error: 'flowId, templateId, or dashboard parameter required' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Flow performance API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    const performanceService = new FlowPerformanceService();

    if (action === 'check-alerts') {
      // Check for performance alerts
      await performanceService.checkAndSendAlerts();
      return NextResponse.json({ success: true, message: 'Alerts checked' });
    }

    if (action === 'cleanup-sessions') {
      // Clean up abandoned sessions
      const enhancedService = new (await import('@sophiaai/services')).EnhancedDocumentService(
        process.env.OPENAI_API_KEY!
      );
      await enhancedService.cleanupAbandonedSessions();
      return NextResponse.json({ success: true, message: 'Cleanup completed' });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Flow performance action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}