/**
 * Admin System Health Check API
 * Epic 6, Story 6.6: System Overview & Monitoring
 *
 * Returns health status for all system services
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';

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

export async function GET() {
  try {
    // Require authentication
    await requireAuth();

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

    // Check WhatsApp webhook (last message received)
    const { data: lastWhatsApp, error: whatsappError } = await supabase
      .from('conversation_logs')
      .select('created_at, channel')
      .eq('channel', 'whatsapp')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!whatsappError && lastWhatsApp) {
      const minutesAgo = (Date.now() - new Date(lastWhatsApp.created_at).getTime()) / 1000 / 60;
      const status: ServiceStatus = minutesAgo < 5 ? 'online' : minutesAgo < 30 ? 'warning' : 'offline';

      health.push({
        service: 'WhatsApp Webhook',
        status,
        lastUpdate: lastWhatsApp.created_at,
        message: `Last message ${Math.round(minutesAgo)}m ago`,
      });
    } else {
      health.push({
        service: 'WhatsApp Webhook',
        status: 'offline',
        lastUpdate: null,
        message: 'No messages received',
      });
    }

    // Check Telegram webhook (last message received)
    const { data: lastTelegram, error: telegramError } = await supabase
      .from('conversation_logs')
      .select('created_at, channel')
      .eq('channel', 'telegram')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!telegramError && lastTelegram) {
      const minutesAgo = (Date.now() - new Date(lastTelegram.created_at).getTime()) / 1000 / 60;
      const status: ServiceStatus = minutesAgo < 5 ? 'online' : minutesAgo < 30 ? 'warning' : 'offline';

      health.push({
        service: 'Telegram Webhook',
        status,
        lastUpdate: lastTelegram.created_at,
        message: `Last message ${Math.round(minutesAgo)}m ago`,
      });
    } else {
      health.push({
        service: 'Telegram Webhook',
        status: 'offline',
        lastUpdate: null,
        message: 'No messages received',
      });
    }

    // Check OpenAI API (check last successful AI response)
    const { data: lastAI, error: aiError } = await supabase
      .from('conversation_logs')
      .select('created_at, direction')
      .eq('direction', 'outbound')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!aiError && lastAI) {
      const minutesAgo = (Date.now() - new Date(lastAI.created_at).getTime()) / 1000 / 60;
      const status: ServiceStatus = minutesAgo < 5 ? 'online' : minutesAgo < 30 ? 'warning' : 'offline';

      health.push({
        service: 'OpenAI API',
        status,
        lastUpdate: lastAI.created_at,
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

    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch health status' },
      { status: 500 }
    );
  }
}
