/**
 * Admin Single Agent API
 * Epic 6, Story 6.7: Agent Management
 *
 * Handles getting, updating, and deactivating individual agents
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Fetch agent details
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Fetch usage statistics
    const { count: messageCount } = await supabase
      .from('conversation_logs')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', id);

    const { count: documentCount } = await supabase
      .from('document_generations')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', id);

    const { count: calculatorCount } = await supabase
      .from('calculator_history')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', id);

    // Fetch last active timestamp
    const { data: lastActivity } = await supabase
      .from('conversation_logs')
      .select('timestamp')
      .eq('agent_id', id)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    // Fetch recent activity (last 10)
    const { data: recentMessages } = await supabase
      .from('conversation_logs')
      .select('id, message_text, direction, timestamp')
      .eq('agent_id', id)
      .order('timestamp', { ascending: false })
      .limit(5);

    const { data: recentDocuments } = await supabase
      .from('document_generations')
      .select('id, template_filename, created_at')
      .eq('agent_id', id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Combine and sort recent activity
    const recentActivity = [
      ...(recentMessages || []).map(msg => ({
        id: msg.id,
        type: 'message' as const,
        description: `${msg.direction === 'inbound' ? 'Received' : 'Sent'} message`,
        timestamp: msg.timestamp,
      })),
      ...(recentDocuments || []).map(doc => ({
        id: doc.id,
        type: 'document' as const,
        description: `Generated ${doc.template_filename?.replace('.docx', '') || 'document'}`,
        timestamp: doc.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return NextResponse.json({
      agent,
      stats: {
        messages: messageCount || 0,
        documents: documentCount || 0,
        calculators: calculatorCount || 0,
        lastActive: lastActivity?.timestamp || null,
      },
      recentActivity,
    });
  } catch (error) {
    console.error('Agent details API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, is_active } = body;

    // Build update object
    const updates: Record<string, unknown> = {};

    if (name !== undefined) updates.name = name;
    if (email !== undefined) {
      // Validate email format
      const emailRegex = /^\S+@\S+$/i;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }

      // Check for duplicate email (excluding current agent)
      const { data: existingEmail } = await supabase
        .from('agents')
        .select('id')
        .eq('email', email)
        .neq('id', id)
        .single();

      if (existingEmail) {
        return NextResponse.json(
          { error: 'An agent with this email already exists' },
          { status: 409 }
        );
      }

      updates.email = email;
    }

    if (phone !== undefined) {
      // Validate phone format (E.164)
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phone)) {
        return NextResponse.json(
          { error: 'Invalid phone format. Use E.164 format (e.g., +35799123456)' },
          { status: 400 }
        );
      }

      // Check for duplicate phone (excluding current agent)
      const { data: existingPhone } = await supabase
        .from('agents')
        .select('id')
        .eq('phone_number', phone)
        .neq('id', id)
        .single();

      if (existingPhone) {
        return NextResponse.json(
          { error: 'An agent with this phone number already exists' },
          { status: 409 }
        );
      }

      updates.phone_number = phone;
    }

    if (is_active !== undefined) updates.is_active = is_active;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Update agent
    const { data: agent, error } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !agent) {
      return NextResponse.json(
        { error: 'Agent not found or update failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('Update agent API error:', error);
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Soft delete: set is_active to false
    const { data: agent, error } = await supabase
      .from('agents')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error || !agent) {
      return NextResponse.json(
        { error: 'Agent not found or deactivation failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, agent });
  } catch (error) {
    console.error('Deactivate agent API error:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate agent' },
      { status: 500 }
    );
  }
}
