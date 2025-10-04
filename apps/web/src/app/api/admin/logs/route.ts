// Story 6.9: System Logs API
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/logs - Fetch system logs with filters
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const level = searchParams.get('level'); // 'error' | 'warning' | 'info'
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const format = searchParams.get('format'); // 'csv' | 'json'

    // Build query for conversation_logs
    let query = supabase
      .from('conversation_logs')
      .select(
        `
        id,
        agent_id,
        message,
        direction,
        error_message,
        created_at,
        agents (
          name,
          phone_number
        )
      `,
        { count: 'exact' }
      );

    // Apply filters
    if (level === 'error') {
      query = query.not('error_message', 'is', null);
    }

    if (search) {
      query = query.or(
        `message.ilike.%${search}%,error_message.ilike.%${search}%`
      );
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: logs, error, count } = await query;

    if (error) {
      console.error('Error fetching logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch logs' },
        { status: 500 }
      );
    }

    // Transform logs to include log level
    const transformedLogs = logs.map((log) => {
      const agent = Array.isArray(log.agents) ? log.agents[0] : log.agents;
      return {
        id: log.id,
        timestamp: log.created_at,
        level: log.error_message ? ('error' as const) : ('info' as const),
        message: log.message || '',
        agent_name: agent?.name || 'Unknown',
        agent_phone: agent?.phone_number || '',
        direction: log.direction,
        details: log.error_message || '',
      };
    });

    // CSV export
    if (format === 'csv') {
      const headers = 'Timestamp,Level,Agent,Phone,Direction,Message,Details';
      const rows = transformedLogs.map(
        (log) =>
          `"${log.timestamp}","${log.level}","${log.agent_name}","${log.agent_phone}","${log.direction}","${log.message.replace(/"/g, '""')}","${log.details.replace(/"/g, '""')}"`
      );
      const csv = [headers, ...rows].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="sophia-logs-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      logs: transformedLogs,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
