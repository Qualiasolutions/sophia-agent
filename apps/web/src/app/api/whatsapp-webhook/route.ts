import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

/**
 * POST handler for Twilio WhatsApp webhook
 * Receives incoming messages from agents via WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    // Parse form data (Twilio sends application/x-www-form-urlencoded)
    const formData = await request.formData();

    const messageBody = formData.get('Body')?.toString();
    const fromNumber = formData.get('From')?.toString();
    const messageSid = formData.get('MessageSid')?.toString();

    // Validate required fields
    if (!messageBody || !fromNumber || !messageSid) {
      console.error('Missing required fields in webhook payload', {
        hasBody: !!messageBody,
        hasFrom: !!fromNumber,
        hasMessageSid: !!messageSid,
      });

      // Return 200 OK even for invalid payloads to prevent Twilio retries
      return NextResponse.json({ status: 'error', message: 'Invalid payload' }, { status: 200 });
    }

    // Strip 'whatsapp:' prefix from phone number (Twilio format: whatsapp:+1234567890)
    const phoneNumber = fromNumber.replace('whatsapp:', '');

    // Acknowledge receipt immediately (within 5 seconds)
    // Process message asynchronously without blocking response
    void processMessageAsync(phoneNumber, messageBody, messageSid);

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);

    // Return 200 OK even on errors to prevent Twilio retries
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 200 }
    );
  }
}

/**
 * Async function to process message and log to database
 * Runs after webhook acknowledgment to avoid blocking
 */
async function processMessageAsync(
  phoneNumber: string,
  messageText: string,
  messageId: string
): Promise<void> {
  try {
    const supabase = createAdminClient();

    // Lookup agent by phone number
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('phone_number', phoneNumber)
      .single();

    if (agentError || !agent) {
      console.warn('Agent not found for phone number', {
        phoneNumber,
        messageId,
        error: agentError?.message,
      });
      return;
    }

    // Insert message into conversation_logs
    const { error: insertError } = await supabase
      .from('conversation_logs')
      .insert({
        agent_id: agent.id,
        message_text: messageText,
        direction: 'inbound',
        timestamp: new Date().toISOString(),
        message_id: messageId,
      });

    if (insertError) {
      // Check if it's a duplicate message ID (Twilio retry)
      if (insertError.code === '23505') {
        console.log('Duplicate message ID, skipping insert', { messageId });
      } else {
        console.error('Database insert error', {
          phoneNumber,
          messageId,
          error: insertError.message,
        });
      }
    } else {
      console.log('Message logged successfully', {
        agentId: agent.id,
        messageId,
        phoneNumber,
      });
    }
  } catch (error) {
    console.error('Error processing message', {
      phoneNumber,
      messageId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
