import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Query agents table
    const { data: agents, error, count } = await supabase
      .from('agents')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        {
          status: 'error',
          message: 'Failed to query database',
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'connected',
      agentCount: count ?? agents?.length ?? 0,
      agents: agents ?? [],
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
