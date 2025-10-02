import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/analytics/documents
 * Get document generation analytics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const template_id = searchParams.get('template_id');

    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Base query
    let query = supabase
      .from('document_generations')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (template_id) {
      query = query.eq('template_id', template_id);
    }

    const { data: generations, error } = await query;

    if (error) {
      console.error('[Analytics API] Error fetching generations:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch analytics data',
        },
        { status: 500 }
      );
    }

    // Calculate metrics
    const totalGenerations = generations?.length || 0;
    const avgGenerationTime =
      generations && generations.length > 0
        ? generations
            .filter((g) => g.generation_time_ms)
            .reduce((sum, g) => sum + (g.generation_time_ms || 0), 0) /
          generations.filter((g) => g.generation_time_ms).length
        : 0;

    // Group by template
    const byTemplate: Record<string, number> = {};
    generations?.forEach((gen) => {
      const templateId = gen.template_id;
      byTemplate[templateId] = (byTemplate[templateId] || 0) + 1;
    });

    // Group by agent
    const byAgent: Record<string, number> = {};
    generations?.forEach((gen) => {
      const agentId = gen.agent_id;
      byAgent[agentId] = (byAgent[agentId] || 0) + 1;
    });

    // Group by day
    const byDay: Record<string, number> = {};
    generations?.forEach((gen) => {
      const day = new Date(gen.created_at).toISOString().split('T')[0];
      if (day) {
        byDay[day] = (byDay[day] || 0) + 1;
      }
    });

    return NextResponse.json({
      success: true,
      period_days: periodDays,
      metrics: {
        total_generations: totalGenerations,
        avg_generation_time_ms: Math.round(avgGenerationTime),
        unique_templates: Object.keys(byTemplate).length,
        unique_agents: Object.keys(byAgent).length,
      },
      breakdown: {
        by_template: byTemplate,
        by_agent: byAgent,
        by_day: byDay,
      },
    });
  } catch (error) {
    console.error('[Analytics API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
