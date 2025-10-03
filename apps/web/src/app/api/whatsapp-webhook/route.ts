import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { OpenAIService, WhatsAppService } from '@sophiaai/services';

/**
 * POST handler for Twilio WhatsApp webhook
 * Receives incoming messages from agents via WhatsApp
 *
 * Performance: Responds within 5 seconds to prevent Twilio retries
 * Error Handling: Returns 200 OK for all scenarios to prevent retry storms
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('=== WEBHOOK CALLED ===', {
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method,
  });

  try {
    // Parse form data (Twilio sends application/x-www-form-urlencoded)
    const formData = await request.formData();

    // DEBUG: Log all form data
    const allFormData: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      allFormData[key] = value.toString();
    }
    console.log('=== WEBHOOK FORM DATA ===', { formData: allFormData });

    const messageStatus = formData.get('MessageStatus')?.toString();
    const messageSid = formData.get('MessageSid')?.toString();

    // Check if this is a status callback (not an incoming message)
    if (messageStatus && messageSid) {
      console.log('DEBUG: Status callback detected', { messageStatus, messageSid });
      // This is a delivery status update
      void processStatusUpdateAsync(messageSid, messageStatus);
      // Return empty TwiML response (Twilio expects XML, not JSON)
      return new NextResponse('<Response></Response>', {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // This is an incoming message
    const messageBody = formData.get('Body')?.toString();
    const fromNumber = formData.get('From')?.toString();

    // Validate required fields for incoming message
    if (!messageBody || !fromNumber || !messageSid) {
      console.error('Missing required fields in webhook payload', {
        hasBody: !!messageBody,
        hasFrom: !!fromNumber,
        hasMessageSid: !!messageSid,
      });

      // Return empty TwiML even for invalid payloads to prevent Twilio retries
      return new NextResponse('<Response></Response>', {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // Strip 'whatsapp:' prefix and all whitespace from phone number
    // Twilio may send: whatsapp:+357 99111668 or whatsapp:+35799111668
    // Normalize to: +35799111668 for database lookup
    const phoneNumber = fromNumber.replace('whatsapp:', '').replace(/\s/g, '');

    // Acknowledge receipt immediately (within 5 seconds requirement)
    // Process message asynchronously without blocking response
    processMessageAsync(phoneNumber, messageBody, messageSid).catch((error) => {
      console.error('CRITICAL: Unhandled error in async message processing', {
        phoneNumber: phoneNumber.substring(0, 7) + 'X'.repeat(Math.max(0, phoneNumber.length - 7)),
        messageId: messageSid,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
    });

    // Return empty TwiML response (Twilio expects XML, not JSON)
    return new NextResponse('<Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Webhook error:', error);

    // Return empty TwiML even on errors to prevent Twilio retries
    return new NextResponse('<Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}

/**
 * Async function to process delivery status updates from Twilio
 * Updates message delivery_status in conversation_logs table
 */
async function processStatusUpdateAsync(
  messageId: string,
  status: string
): Promise<void> {
  try {
    const supabase = createAdminClient();

    // Map Twilio status to our delivery_status enum
    const deliveryStatus = status.toLowerCase();

    // Validate status value
    const validStatuses = ['queued', 'sent', 'delivered', 'read', 'failed', 'undelivered'];
    if (!validStatuses.includes(deliveryStatus)) {
      console.warn('Unknown delivery status received', {
        messageId,
        status: deliveryStatus,
      });
      return;
    }

    // Update delivery_status in conversation_logs
    const { error: updateError } = await supabase
      .from('conversation_logs')
      .update({ delivery_status: deliveryStatus })
      .eq('message_id', messageId);

    if (updateError) {
      console.error('Error updating delivery status', {
        messageId,
        status: deliveryStatus,
        error: updateError.message,
      });
    } else {
      console.log('Delivery status updated successfully', {
        messageId,
        status: deliveryStatus,
      });

      // Log failed deliveries for monitoring
      if (deliveryStatus === 'failed' || deliveryStatus === 'undelivered') {
        console.error('Message delivery failed', {
          messageId,
          status: deliveryStatus,
        });
      }
    }
  } catch (error) {
    console.error('Error processing status update', {
      messageId,
      status,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Async function to process message, generate AI response, and send reply
 * Runs after webhook acknowledgment to avoid blocking
 * Complete flow: receive → log inbound → generate AI response → send reply → log outbound
 */
async function processMessageAsync(
  phoneNumber: string,
  messageText: string,
  messageId: string
): Promise<void> {
  const supabase = createAdminClient();

  try {
    // Lookup agent by phone number
    console.log('DEBUG: Looking up agent', {
      phoneNumber,
      phoneNumberLength: phoneNumber.length,
      phoneNumberCharCodes: Array.from(phoneNumber).map(c => c.charCodeAt(0))
    });

    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, name, phone_number')
      .eq('phone_number', phoneNumber)
      .single();

    console.log('DEBUG: Agent lookup result', {
      found: !!agent,
      agentId: agent?.id,
      agentName: agent?.name,
      agentPhone: agent?.phone_number,
      hasError: !!agentError,
      errorCode: agentError?.code,
      errorMessage: agentError?.message
    });

    if (agentError || !agent) {
      console.warn('Unregistered agent attempted to contact Sophia', {
        phoneNumber: phoneNumber.substring(0, 7) + 'X'.repeat(phoneNumber.length - 7),
        messageId,
        error: agentError?.message,
      });

      // Send polite rejection message to unregistered agent
      try {
        const whatsappService = new WhatsAppService({ supabaseClient: supabase });
        const rejectionMessage = "Hi! I'm Sophia, the AI assistant for zyprus.com agents. This service is currently available only to registered agents. Please contact your administrator for access.";

        await whatsappService.sendMessage(
          { phoneNumber, messageText: rejectionMessage }
        );

        console.log('Rejection message sent to unregistered agent', {
          phoneNumber: phoneNumber.substring(0, 7) + 'X'.repeat(phoneNumber.length - 7),
          messageId,
        });

        // Log unregistered agent attempt to database
        await supabase.from('conversation_logs').insert({
          agent_id: null, // No agent ID for unregistered attempts
          message_text: messageText,
          direction: 'inbound',
          timestamp: new Date().toISOString(),
          message_id: messageId,
        });

        await supabase.from('conversation_logs').insert({
          agent_id: null,
          message_text: rejectionMessage,
          direction: 'outbound',
          timestamp: new Date().toISOString(),
          message_id: `${messageId}_rejection`,
        });
      } catch (error) {
        console.error('Error sending rejection message to unregistered agent', {
          phoneNumber: phoneNumber.substring(0, 7) + 'X'.repeat(phoneNumber.length - 7),
          messageId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      return; // Exit without OpenAI processing
    }

    // Log inbound message to conversation_logs
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
        console.log('Duplicate message ID, skipping processing', { messageId });
        return;
      } else {
        console.error('Database insert error for inbound message', {
          phoneNumber,
          messageId,
          error: insertError.message,
        });
        // Continue processing even if logging fails
      }
    } else {
      console.log('Inbound message logged successfully', {
        agentId: agent.id,
        messageId,
        phoneNumber,
      });
    }

    // Generate AI response using OpenAI service
    try {
      const openaiService = new OpenAIService();
      const aiResponse = await openaiService.generateResponse(messageText, {
        agentId: agent.id,
      });

      console.log('AI response generated', {
        agentId: agent.id,
        messageId,
        responseLength: aiResponse.text.length,
        tokensUsed: aiResponse.tokensUsed.total,
        costEstimate: `$${aiResponse.costEstimate.toFixed(6)}`,
        responseTime: `${aiResponse.responseTime}ms`,
      });

      // Send WhatsApp reply using WhatsApp service
      const whatsappService = new WhatsAppService({ supabaseClient: supabase });
      const sendResult = await whatsappService.sendMessage(
        { phoneNumber, messageText: aiResponse.text },
        agent.id
      );

      if (sendResult.success) {
        console.log('WhatsApp reply sent successfully', {
          agentId: agent.id,
          originalMessageId: messageId,
          replyMessageId: sendResult.messageId,
          phoneNumber,
        });
      } else {
        console.error('Failed to send WhatsApp reply', {
          agentId: agent.id,
          originalMessageId: messageId,
          error: sendResult.error,
          phoneNumber,
        });
      }
    } catch (error) {
      console.error('Error generating AI response or sending reply', {
        agentId: agent.id,
        messageId,
        phoneNumber,
        error: error instanceof Error ? error.message : 'Unknown error',
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
