/**
 * Admin System Health Check API
 * Epic 6, Story 6.6: System Overview & Monitoring
 *
 * Returns health status for all system services
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ServiceStatus = 'online' | 'warning' | 'offline';

interface HealthCheck {
  service: string;
  status: ServiceStatus;
  lastUpdate: string | null;
  message?: string;
}

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

    const health: HealthCheck[] = [];

    // Check database connection
    try {
      const { error: dbError } = await supabase
        .from('agents')
        .select('id')
        .limit(1)
        .single();

      health.push({
        service: 'Database',
        status: dbError ? 'offline' : 'online',
        lastUpdate: new Date().toISOString(),
        message: dbError ? 'Connection failed' : 'Connected',
      });
    } catch {
      health.push({
        service: 'Database',
        status: 'offline',
        lastUpdate: null,
        message: 'Connection error',
      });
    }

    // Check messaging webhook (last inbound message received)
    const { data: lastInbound, error: inboundError } = await supabase
      .from('conversation_logs')
      .select('timestamp')
      .eq('direction', 'inbound')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (!inboundError && lastInbound) {
      const minutesAgo = (Date.now() - new Date(lastInbound.timestamp).getTime()) / 1000 / 60;
      const status: ServiceStatus = minutesAgo < 5 ? 'online' : minutesAgo < 30 ? 'warning' : 'offline';

      health.push({
        service: 'Messaging Webhook',
        status,
        lastUpdate: lastInbound.timestamp,
        message: `Last message ${Math.round(minutesAgo)}m ago`,
      });
    } else {
      health.push({
        service: 'Messaging Webhook',
        status: 'offline',
        lastUpdate: null,
        message: 'No messages received',
      });
    }

    // Check OpenAI API (check last successful AI response)
    const { data: lastAI, error: aiError } = await supabase
      .from('conversation_logs')
      .select('timestamp')
      .eq('direction', 'outbound')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (!aiError && lastAI) {
      const minutesAgo = (Date.now() - new Date(lastAI.timestamp).getTime()) / 1000 / 60;
      const status: ServiceStatus = minutesAgo < 5 ? 'online' : minutesAgo < 30 ? 'warning' : 'offline';

      health.push({
        service: 'OpenAI API',
        status,
        lastUpdate: lastAI.timestamp,
        message: `Last response ${Math.round(minutesAgo)}m ago`,
      });
    } else {
      health.push({
        service: 'OpenAI API',
        status: 'offline',
        lastUpdate: null,
        message: 'No responses generated',
      });
    }

    return NextResponse.json({ health });
  } catch (error) {
    console.error('Health API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health status' },
      { status: 500 }
    );
  }
}
