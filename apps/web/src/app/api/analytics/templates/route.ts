import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/analytics/templates
 * Get template usage statistics
 */
export async function GET() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch all templates
    const { data: templates, error: templatesError } = await supabase
      .from('document_templates')
      .select('id, name, category, created_at, is_active')
      .order('name', { ascending: true });

    if (templatesError) {
      console.error('[Analytics API] Error fetching templates:', templatesError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch templates',
        },
        { status: 500 }
      );
    }

    // Fetch generation counts per template
    const { data: generationCounts, error: countsError } = await supabase
      .from('document_generations')
      .select('template_id');

    if (countsError) {
      console.error('[Analytics API] Error fetching generation counts:', countsError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch generation counts',
        },
        { status: 500 }
      );
    }

    // Count generations per template
    const countsByTemplate: Record<string, number> = {};
    generationCounts?.forEach((gen) => {
      const templateId = gen.template_id;
      countsByTemplate[templateId] = (countsByTemplate[templateId] || 0) + 1;
    });

    // Build response with usage stats
    const templatesWithStats = templates?.map((template) => ({
      id: template.id,
      name: template.name,
      category: template.category,
      is_active: template.is_active,
      created_at: template.created_at,
      usage_count: countsByTemplate[template.id] || 0,
    })) || [];

    // Sort by usage count descending
    templatesWithStats.sort((a, b) => b.usage_count - a.usage_count);

    return NextResponse.json({
      success: true,
      templates: templatesWithStats,
      total_templates: templatesWithStats.length,
      active_templates: templatesWithStats.filter((t) => t.is_active).length,
      most_used: templatesWithStats[0] || null,
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
