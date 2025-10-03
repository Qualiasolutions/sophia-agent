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

    // Process message and wait for completion (instead of fire-and-forget)
    // This ensures Vercel doesn't kill the function before processing completes
    await processMessageAsync(phoneNumber, messageBody, messageSid).catch((error) => {
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
    // Lookup agent by phone number (optional for sandbox mode)
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

    // If agent not found, continue anyway (sandbox mode - allow all users)
    const agentId = agent?.id || null;

    if (!agent) {
      console.log('Guest user (unregistered) accessing Sophia', {
        phoneNumber: phoneNumber.substring(0, 7) + 'X'.repeat(phoneNumber.length - 7),
        messageId,
      });
    }

    // Log inbound message to conversation_logs
    const { error: insertError } = await supabase
      .from('conversation_logs')
      .insert({
        agent_id: agentId,
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
        agentId,
        messageId,
        phoneNumber,
      });
    }

    // Fetch recent conversation history for context (last 10 messages)
    const { data: conversationHistory } = await supabase
      .from('conversation_logs')
      .select('message_text, direction, timestamp')
      .eq('agent_id', agentId)
      .order('timestamp', { ascending: false })
      .limit(10);

    // Convert to OpenAI message format (reverse to chronological order)
    const messageHistory = conversationHistory
      ?.reverse()
      .map((msg) => ({
        role: msg.direction === 'inbound' ? ('user' as const) : ('assistant' as const),
        content: msg.message_text,
      })) || [];

    // Generate AI response using OpenAI service
    try {
      console.log('DEBUG: Creating OpenAIService instance', {
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
        historyCount: messageHistory.length,
      });

      const openaiService = new OpenAIService();

      console.log('DEBUG: Calling generateResponse', {
        messageText,
        agentId,
        historyCount: messageHistory.length,
      });

      const aiResponse = await openaiService.generateResponse(messageText, {
        agentId: agentId || 'guest',
        messageHistory,
      });

      console.log('DEBUG: generateResponse completed successfully');

      console.log('AI response generated', {
        agentId,
        messageId,
        responseLength: aiResponse.text.length,
        tokensUsed: aiResponse.tokensUsed.total,
        costEstimate: `$${aiResponse.costEstimate.toFixed(6)}`,
        responseTime: `${aiResponse.responseTime}ms`,
        isAssistantResponse: !!(aiResponse.threadId && aiResponse.assistantId),
      });

      // Log to document_generations if this was an Assistant response (document generation)
      if (aiResponse.threadId && aiResponse.assistantId && agentId) {
        try {
          const { error: docGenError } = await supabase
            .from('document_generations')
            .insert({
              agent_id: agentId,
              generated_content: aiResponse.text,
              thread_id: aiResponse.threadId,
              assistant_id: aiResponse.assistantId,
              run_id: aiResponse.runId || null,
              generation_time_ms: aiResponse.responseTime,
              variables_provided: {},
              template_filename: null, // Will be extracted later if needed
            });

          if (docGenError) {
            console.error('[Document Generation] Failed to log generation', {
              agentId,
              threadId: aiResponse.threadId,
              error: docGenError.message,
            });
          } else {
            console.log('[Document Generation] Logged successfully', {
              agentId,
              threadId: aiResponse.threadId,
              assistantId: aiResponse.assistantId,
            });
          }
        } catch (logError) {
          console.error('[Document Generation] Error logging generation', {
            agentId,
            error: logError instanceof Error ? logError.message : 'Unknown error',
          });
        }
      }

      // Send WhatsApp reply using WhatsApp service
      const whatsappService = new WhatsAppService({ supabaseClient: supabase });
      const sendResult = await whatsappService.sendMessage(
        { phoneNumber, messageText: aiResponse.text },
        agentId || undefined
      );

      if (sendResult.success) {
        console.log('WhatsApp reply sent successfully', {
          agentId,
          originalMessageId: messageId,
          replyMessageId: sendResult.messageId,
          phoneNumber,
        });
      } else {
        console.error('Failed to send WhatsApp reply', {
          agentId,
          originalMessageId: messageId,
          error: sendResult.error,
          phoneNumber,
        });
      }
    } catch (error) {
      console.error('Error generating AI response or sending reply', {
        agentId,
        messageId,
        phoneNumber,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Send fallback error message to user
      try {
        const whatsappService = new WhatsAppService({ supabaseClient: supabase });
        const fallbackMessage = "I'm having trouble processing your request right now. Please try again in a moment.";

        await whatsappService.sendMessage(
          { phoneNumber, messageText: fallbackMessage },
          agentId || undefined
        );

        console.log('Fallback error message sent to user', {
          agentId,
          messageId,
          phoneNumber: phoneNumber.substring(0, 7) + 'X'.repeat(phoneNumber.length - 7),
        });
      } catch (fallbackError) {
        console.error('Failed to send fallback error message', {
          agentId,
          messageId,
          error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error',
        });
      }
    }
  } catch (error) {
    console.error('Error processing message', {
      phoneNumber,
      messageId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
