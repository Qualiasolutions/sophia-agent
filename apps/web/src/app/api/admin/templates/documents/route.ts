// Story 6.9: Document Templates Metadata API
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/admin/templates/documents - List document template metadata
export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin user
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, is_active')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Query document_generations grouped by template_filename
    const { data: templates, error } = await supabase.rpc(
      'get_document_template_stats'
    );

    if (error) {
      // Fallback if RPC doesn't exist - query directly
      const { data: generations, error: genError } = await supabase
        .from('document_generations')
        .select('template_filename, created_at')
        .order('created_at', { ascending: false });

      if (genError) {
        console.error('Error fetching document generations:', genError);
        return NextResponse.json(
          { error: 'Failed to fetch document templates' },
          { status: 500 }
        );
      }

      // Group by template_filename
      const templateMap = new Map<
        string,
        { usage_count: number; last_used: string }
      >();

      generations.forEach((gen) => {
        const filename = gen.template_filename || 'unknown';
        const existing = templateMap.get(filename);
        if (existing) {
          existing.usage_count += 1;
          if (gen.created_at > existing.last_used) {
            existing.last_used = gen.created_at;
          }
        } else {
          templateMap.set(filename, {
            usage_count: 1,
            last_used: gen.created_at,
          });
        }
      });

      // Convert map to array
      const templateStats = Array.from(templateMap.entries())
        .map(([template_filename, stats]) => ({
          template_filename,
          usage_count: stats.usage_count,
          last_used: stats.last_used,
        }))
        .sort((a, b) => b.usage_count - a.usage_count);

      return NextResponse.json({ templates: templateStats });
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error in GET /api/admin/templates/documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
