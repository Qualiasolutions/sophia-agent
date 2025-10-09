/**
 * Document Sessions API
 * Manages multi-step document generation sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EnhancedDocumentService } from '@sophiaai/services';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const agentId = searchParams.get('agentId');

    if (sessionId) {
      // Get specific session
      const { data: session, error } = await supabase
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

      return NextResponse.json({ session });
    }

    if (agentId) {
      // Get all sessions for agent
      const { data: sessions, error } = await supabase
        .from('document_request_sessions')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch sessions' },
          { status: 500 }
        );
      }

      return NextResponse.json({ sessions });
    }

    return NextResponse.json(
      { error: 'sessionId or agentId is required' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Sessions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, templateId, message } = body;

    if (!agentId || !templateId || !message) {
      return NextResponse.json(
        { error: 'agentId, templateId, and message are required' },
        { status: 400 }
      );
    }

    // Create new session with enhanced service
    const enhancedService = new EnhancedDocumentService(process.env.OPENAI_API_KEY!);

    const response = await enhancedService.generateDocument({
      message,
      agentId,
      context: { platform: 'api' }
    });

    // If it's a flow, create session record
    if (response.type === 'question' && response.templateId) {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const { data: session, error } = await supabase
        .from('document_request_sessions')
        .insert({
          id: sessionId,
          agent_id: agentId,
          document_template_id: response.templateId,
          collected_fields: response.collectedFields || {},
          missing_fields: response.missingFields || [],
          status: 'collecting',
          last_prompt: response.nextStep || 'category',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Failed to create session' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        session,
        response: {
          type: response.type,
          content: response.content,
          templateId: response.templateId,
          templateName: response.templateName,
          nextStep: response.nextStep,
          fieldDefinitions: response.fieldDefinitions,
          collectedFields: response.collectedFields,
          missingFields: response.missingFields
        }
      });
    }

    // Return direct document response
    return NextResponse.json({
      response: {
        type: response.type,
        content: response.content,
        templateId: response.templateId,
        templateName: response.templateName,
        metadata: response.metadata
      }
    });

  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, message, collectedFields } = body;

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: 'sessionId and message are required' },
        { status: 400 }
      );
    }

    // Get existing session
    const { data: session, error: fetchError } = await supabase
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

    // Continue flow with enhanced service
    const enhancedService = new EnhancedDocumentService(process.env.OPENAI_API_KEY!);

    const response = await enhancedService.generateDocument({
      message,
      agentId: session.agent_id,
      sessionId,
      context: { platform: 'api' },
      previousStep: session.last_prompt,
      collectedFields: { ...session.collected_fields, ...collectedFields }
    });

    // Update session
    const updateData: any = {
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

    const { data: updatedSession, error: updateError } = await supabase
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
    console.error('Session update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Cancel/complete session
    const { error } = await supabase
      .from('document_request_sessions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to cancel session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Session cancellation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}