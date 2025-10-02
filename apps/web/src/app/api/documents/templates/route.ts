import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/documents/templates
 * List all document templates (with optional filtering)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'active';

    let query = supabase
      .from('document_templates')
      .select('*')
      .eq('status', status)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error('[Templates API] Error fetching templates:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch templates',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      templates: templates || [],
      count: templates?.length || 0,
    });
  } catch (error) {
    console.error('[Templates API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
