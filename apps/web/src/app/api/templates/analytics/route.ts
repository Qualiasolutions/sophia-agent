/**
 * Template Analytics API Endpoint
 * Provides analytics data for template performance monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TemplateAnalyticsService } from '@sophiaai/services';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const analytics = new TemplateAnalyticsService();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || undefined;
    const sortBy = searchParams.get('sortBy') as any || 'usage';
    const limit = parseInt(searchParams.get('limit') || '50');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Determine which data to return based on parameters
    const report = searchParams.get('report');

    if (report === 'performance') {
      // Generate full performance report
      const performanceReport = await analytics.generatePerformanceReport(
        dateFrom ? new Date(dateFrom) : undefined,
        dateTo ? new Date(dateTo) : undefined
      );

      return NextResponse.json({
        success: true,
        data: performanceReport
      });
    }

    if (report === 'suggestions') {
      // Get optimization suggestions
      const suggestions = await analytics.getOptimizationSuggestions();

      return NextResponse.json({
        success: true,
        data: suggestions
      });
    }

    // Default: return template metrics
    const metrics = await analytics.getTemplateMetrics({
      category,
      sortBy,
      limit,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined
    });

    return NextResponse.json({
      success: true,
      data: metrics,
      meta: {
        count: metrics.length,
        category,
        sortBy,
        limit
      }
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const analytics = new TemplateAnalyticsService();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { templateId, metrics } = body;

    if (!templateId || !metrics) {
      return NextResponse.json(
        { error: 'Missing required fields: templateId, metrics' },
        { status: 400 }
      );
    }

    // Track usage
    await analytics.trackUsage(templateId, metrics);

    return NextResponse.json({
      success: true,
      message: 'Usage tracked successfully'
    });

  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json(
      {
        error: 'Failed to track usage',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}