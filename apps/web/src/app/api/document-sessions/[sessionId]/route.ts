/**
 * Document Session Management API
 * Handles individual session operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { EnhancedDocumentService } from '@sophiaai/services';
import { tryCreateAdminClient } from '@/lib/supabase';

const supabase = tryCreateAdminClient();

export async function GET(_request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const supabaseClient = supabase;

    if (!supabaseClient) {
      console.error('[Document Session API] Supabase client unavailable');
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      );
    }

    const { sessionId } = await params;

    const { data: session, error } = await supabaseClient
      .from('document_request_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get template details
    const { data: template } = await supabaseClient
      .from('enhanced_templates')
      .select('name, category, flow, fields')
      .eq('template_id', session.document_template_id)
      .single();

    return NextResponse.json({
      session,
      template: template || null
    });

  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const supabaseClient = supabase;

    if (!supabaseClient) {
      console.error('[Document Session API] Supabase client unavailable');
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      );
    }

    const { sessionId } = await params;
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      );
    }

    // Get session
    const { data: session, error: fetchError } = await supabaseClient
      .from('document_request_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Resume flow
    const enhancedService = new EnhancedDocumentService(process.env.OPENAI_API_KEY!);

    const response = await enhancedService.generateDocument({
      message,
      agentId: session.agent_id,
      sessionId,
      context: { platform: 'api', resuming: true },
      previousStep: session.last_prompt,
      collectedFields: session.collected_fields
    });

    // Update session
    const updateData: Record<string, unknown> = {
      collected_fields: { ...session.collected_fields, ...response.collectedFields },
      missing_fields: response.missingFields || [],
      updated_at: new Date().toISOString()
    };

    if (response.type === 'question') {
      updateData.last_prompt = response.nextStep || session.last_prompt;
      updateData.status = 'collecting';
    } else {
      updateData.status = 'complete';
    }

    const { data: updatedSession, error: updateError } = await supabaseClient
      .from('document_request_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      session: updatedSession,
      response: {
        type: response.type,
        content: response.content,
        templateId: response.templateId,
        templateName: response.templateName,
        nextStep: response.nextStep,
        collectedFields: response.collectedFields,
        missingFields: response.missingFields,
        metadata: response.metadata
      }
    });

  } catch (error) {
    console.error('Session resume error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const supabaseClient = supabase;

    if (!supabaseClient) {
      console.error('[Document Session API] Supabase client unavailable');
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 }
      );
    }

    const { sessionId } = await params;

    const { error } = await supabaseClient
      .from('document_request_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Session deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
