// Story 6.9: Individual Calculator Management API
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/calculators/[id] - Fetch single calculator
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Fetch calculator
    const { data: calculator, error } = await supabase
      .from('calculators')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching calculator:', error);
      return NextResponse.json(
        { error: 'Calculator not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ calculator });
  } catch (error) {
    console.error('Error in GET /api/admin/calculators/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/calculators/[id] - Update calculator
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Parse request body
    const body = await request.json();
    const { name, description, input_fields, is_active, tool_url } = body;

    // Build update object (only include provided fields)
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (input_fields !== undefined) updateData.input_fields = input_fields;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (tool_url !== undefined) updateData.tool_url = tool_url;

    // Update calculator
    const { data: updatedCalculator, error } = await supabase
      .from('calculators')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating calculator:', error);
      return NextResponse.json(
        { error: 'Failed to update calculator' },
        { status: 500 }
      );
    }

    return NextResponse.json({ calculator: updatedCalculator });
  } catch (error) {
    console.error('Error in PATCH /api/admin/calculators/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
