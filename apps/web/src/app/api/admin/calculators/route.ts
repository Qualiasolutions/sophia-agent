// Story 6.9: Calculator Management API
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/admin/calculators - List all calculators
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

    // Fetch all calculators with usage stats
    const { data: calculators, error } = await supabase
      .from('calculators')
      .select(
        `
        id,
        name,
        tool_url,
        description,
        input_fields,
        is_active,
        created_at,
        updated_at
      `
      )
      .order('name');

    if (error) {
      console.error('Error fetching calculators:', error);
      return NextResponse.json(
        { error: 'Failed to fetch calculators' },
        { status: 500 }
      );
    }

    // Get usage count for each calculator
    const { data: usageCounts } = await supabase
      .from('calculator_history')
      .select('calculator_id')
      .then((result) => {
        if (result.error) return { data: {} };
        const counts: Record<string, number> = {};
        result.data.forEach((item) => {
          counts[item.calculator_id] = (counts[item.calculator_id] || 0) + 1;
        });
        return { data: counts };
      });

    // Attach usage count to each calculator
    const calculatorsWithStats = calculators.map((calc) => ({
      ...calc,
      usage_count: (usageCounts as Record<string, number>)[calc.id] || 0,
    }));

    return NextResponse.json({ calculators: calculatorsWithStats });
  } catch (error) {
    console.error('Error in GET /api/admin/calculators:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
