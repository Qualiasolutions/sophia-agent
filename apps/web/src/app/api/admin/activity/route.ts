/**
 * Admin Recent Activity Feed API
 * Epic 6, Story 6.6: System Overview & Monitoring
 *
 * Returns recent activities across all agents
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Activity {
  id: string;
  type: 'message' | 'document' | 'calculator';
  agentName: string;
  description: string;
  timestamp: string;
}

export async function GET() {
  try {
    // Require authentication
    await requireAuth();

    const activities: Activity[] = [];

    // Get recent messages
    const { data: messages, error: messagesError } = await supabase
      .from('conversation_logs')
      .select(`
        id,
        created_at,
        direction,
        channel,
        agent_id,
        agents (name)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!messagesError && messages) {
      messages.forEach((msg) => {
        const agent = msg.agents as unknown as { name: string } | null;
        activities.push({
          id: msg.id,
          type: 'message',
          agentName: agent?.name ?? 'Unknown Agent',
          description: `${msg.direction === 'inbound' ? 'Received' : 'Sent'} ${msg.channel} message`,
          timestamp: msg.created_at,
        });
      });
    }

    // Get recent documents
    const { data: documents, error: documentsError } = await supabase
      .from('document_generations')
      .select(`
        id,
        created_at,
        document_type,
        agent_id,
        agents (name)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!documentsError && documents) {
      documents.forEach((doc) => {
        const agent = doc.agents as unknown as { name: string } | null;
        activities.push({
          id: doc.id,
          type: 'document',
          agentName: agent?.name ?? 'Unknown Agent',
          description: `Generated ${doc.document_type} document`,
          timestamp: doc.created_at,
        });
      });
    }

    // Get recent calculator uses
    const { data: calculators, error: calculatorsError } = await supabase
      .from('calculator_history')
      .select(`
        id,
        created_at,
        calculator_type,
        agent_id,
        agents (name)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!calculatorsError && calculators) {
      calculators.forEach((calc) => {
        const agent = calc.agents as unknown as { name: string } | null;
        activities.push({
          id: calc.id,
          type: 'calculator',
          agentName: agent?.name ?? 'Unknown Agent',
          description: `Used ${calc.calculator_type} calculator`,
          timestamp: calc.created_at,
        });
      });
    }

    // Sort all activities by timestamp and limit to 20
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const recentActivities = activities.slice(0, 20);

    return NextResponse.json({ activities: recentActivities });
  } catch (error) {
    console.error('Activity API error:', error);

    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch recent activities' },
      { status: 500 }
    );
  }
}
