/**
 * Admin Agents API
 * Epic 6, Story 6.7: Agent Management
 *
 * Handles listing and creating agents
 */

import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';
import { tryCreateAdminClient } from '@/lib/supabase';

const supabase = tryCreateAdminClient();

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      console.error('[Agents API] Supabase client unavailable');
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      );
    }

    // Check authentication
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // 'active', 'inactive', or null for all

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('agents')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply status filter
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    // Apply pagination and sorting
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: agents, count, error } = await query;

    if (error) throw error;

    const totalPages = count ? Math.ceil(count / limit) : 0;

    return NextResponse.json({
      agents: agents || [],
      total: count || 0,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error('Agents API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!supabase) {
      console.error('[Agents API] Supabase client unavailable');
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { name, email, phone } = body;

    // Validate required fields
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Name, email, and phone are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^\S+@\S+$/i;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate phone format (E.164)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone format. Use E.164 format (e.g., +35799123456)' },
        { status: 400 }
      );
    }

    // Check for duplicate email
    const { data: existingEmail } = await supabase
      .from('agents')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return NextResponse.json(
        { error: 'An agent with this email already exists' },
        { status: 409 }
      );
    }

    // Check for duplicate phone
    const { data: existingPhone } = await supabase
      .from('agents')
      .select('id')
      .eq('phone_number', phone)
      .single();

    if (existingPhone) {
      return NextResponse.json(
        { error: 'An agent with this phone number already exists' },
        { status: 409 }
      );
    }

    // Create agent
    const { data: agent, error } = await supabase
      .from('agents')
      .insert({
        name,
        email,
        phone_number: phone,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    console.error('Create agent API error:', error);
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}
