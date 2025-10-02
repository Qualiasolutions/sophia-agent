import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { OpenAIService, WhatsAppService } from '@sophiaai/services';

/**
 * Test endpoint to manually trigger message processing
 * Used for debugging production issues
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { phoneNumber, message } = await request.json();

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Missing phoneNumber or message' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Step 1: Lookup agent
    console.log('Step 1: Looking up agent', { phoneNumber });
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name')
      .eq('phone_number', phoneNumber)
      .single();

    if (agentError || !agent) {
      return NextResponse.json({
        error: 'Agent not found',
        phoneNumber,
        agentError: agentError?.message,
      }, { status: 404 });
    }

    console.log('Step 1: Agent found', { agentId: agent.id, agentName: agent.name });

    // Step 2: Generate AI response
    console.log('Step 2: Generating AI response');
    const openaiService = new OpenAIService();

    let aiResponse;
    try {
      aiResponse = await openaiService.generateResponse(message, {
        agentId: agent.id,
      });
      console.log('Step 2: AI response generated', {
        responseLength: aiResponse.text.length,
        tokensUsed: aiResponse.tokensUsed.total,
      });
    } catch (error) {
      console.error('Step 2: OpenAI error', error);
      return NextResponse.json({
        error: 'OpenAI service error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, { status: 500 });
    }

    // Step 3: Send WhatsApp message
    console.log('Step 3: Sending WhatsApp message');
    const whatsappService = new WhatsAppService({ supabaseClient: supabase });

    let sendResult;
    try {
      sendResult = await whatsappService.sendMessage(
        {
          phoneNumber: phoneNumber,
          messageText: aiResponse.text,
        },
        agent.id
      );
      console.log('Step 3: WhatsApp send result', sendResult);
    } catch (error) {
      console.error('Step 3: WhatsApp error', error);
      return NextResponse.json({
        error: 'WhatsApp service error',
        details: error instanceof Error ? error.message : 'Unknown error',
        aiResponse: aiResponse.text,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      agent: { id: agent.id, name: agent.name },
      aiResponse: {
        text: aiResponse.text,
        tokensUsed: aiResponse.tokensUsed.total,
        costEstimate: aiResponse.costEstimate,
      },
      whatsapp: sendResult,
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
