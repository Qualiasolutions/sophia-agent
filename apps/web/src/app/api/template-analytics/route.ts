/**
 * Template Analytics API Endpoint
 * Provides analytics data for the template system dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { TemplateAnalyticsService } from '@sophiaai/services';

const analyticsService = new TemplateAnalyticsService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const templateId = searchParams.get('templateId');
    const period = searchParams.get('period') as 'day' | 'week' | 'month' | 'year' || 'month';
    const format = searchParams.get('format') as 'json' | 'csv' || 'json';

    // Authorization check (in production, verify API key)
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    switch (action) {
      case 'summary':
        const summary = await analyticsService.getAnalyticsSummary(period);
        return NextResponse.json(summary);

      case 'template':
        if (!templateId) {
          return NextResponse.json(
            { error: 'templateId is required' },
            { status: 400 }
          );
        }
        const templateAnalytics = await analyticsService.getTemplateAnalytics(templateId, period);
        return NextResponse.json(templateAnalytics);

      case 'insights':
        const insights = await analyticsService.getPerformanceInsights();
        return NextResponse.json(insights);

      case 'export':
        const exportData = await analyticsService.exportAnalytics(format as 'json' | 'csv', period);

        if (format === 'csv') {
          return new NextResponse(exportData, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': `attachment; filename="template-analytics-${period}.csv"`
            }
          });
        }

        return NextResponse.json(JSON.parse(exportData));

      default:
        // Return summary by default
        const defaultSummary = await analyticsService.getAnalyticsSummary(period);
        return NextResponse.json(defaultSummary);
    }

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Record template usage
    const body = await request.json();
    const { templateId, metrics } = body;

    if (!templateId || !metrics) {
      return NextResponse.json(
        { error: 'templateId and metrics are required' },
        { status: 400 }
      );
    }

    // Authorization check
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await analyticsService.recordUsage(templateId, metrics);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Analytics recording error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}