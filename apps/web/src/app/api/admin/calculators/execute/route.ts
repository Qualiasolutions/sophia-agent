// Calculator Execution API
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { CalculatorService } from '@sophiaai/services';

// POST /api/admin/calculators/execute - Execute a calculator
export async function POST(request: Request) {
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

    const body = await request.json();
    const { calculator_name, inputs } = body;

    if (!calculator_name || !inputs) {
      return NextResponse.json(
        { error: 'Missing calculator_name or inputs' },
        { status: 400 }
      );
    }

    // Execute calculator
    const result = CalculatorService.executeCalculator({
      calculator_name,
      inputs,
    });

    // Save to calculator history
    if (result.success) {
      const { error: historyError } = await supabase
        .from('calculator_history')
        .insert({
          calculator_id: calculator_name,
          user_id: user.id,
          inputs,
          result: result.result,
          success: result.success,
          created_at: new Date().toISOString(),
        });

      if (historyError) {
        console.error('Error saving calculator history:', historyError);
        // Don't fail the request if history logging fails
      }
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in POST /api/admin/calculators/execute:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}