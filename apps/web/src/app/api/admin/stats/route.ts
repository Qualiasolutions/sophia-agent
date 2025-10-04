/**
 * Admin Dashboard Statistics API
 * Epic 6, Story 6.6: System Overview & Monitoring
 *
 * Returns key metrics for admin dashboard overview
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get total agents (active)
    const { count: totalAgents, error: agentsError } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (agentsError) throw agentsError;

    // Get active conversations (last 24 hours)
    const { count: activeConversations, error: conversationsError } = await supabase
      .from('conversation_logs')
      .select('agent_id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (conversationsError) throw conversationsError;

    // Get messages today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: messagesToday, error: messagesTodayError } = await supabase
      .from('conversation_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    if (messagesTodayError) throw messagesTodayError;

    // Get documents this week
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const { count: documentsThisWeek, error: documentsError } = await supabase
      .from('document_generations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    if (documentsError) throw documentsError;

    // Get calculator uses this week
    const { count: calculatorsThisWeek, error: calculatorsError } = await supabase
      .from('calculator_history')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    if (calculatorsError) throw calculatorsError;

    return NextResponse.json({
      totalAgents: totalAgents ?? 0,
      activeConversations: activeConversations ?? 0,
      messagesToday: messagesToday ?? 0,
      documentsThisWeek: documentsThisWeek ?? 0,
      calculatorsThisWeek: calculatorsThisWeek ?? 0,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
