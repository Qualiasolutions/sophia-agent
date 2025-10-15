import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { OpenAIService, WhatsAppMetaService, CalculatorService } from '@sophiaai/services';

/**
 * Meta Cloud API Webhook Types
 */
interface WhatsAppWebhookEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product: string;
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      contacts?: Array<{
        profile: { name: string };
        wa_id: string;
      }>;
      messages?: Array<{
        from: string;
        id: string;
        timestamp: string;
        type: string;
        text?: { body: string };
      }>;
      statuses?: Array<{
        id: string;
        status: string;
        timestamp: string;
        recipient_id: string;
      }>;
    };
    field: string;
  }>;
}

/**
 * GET handler for webhook verification (Meta Cloud API)
 * Verifies webhook URL during initial setup
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  console.log('[Webhook Verify] Received verification request', {
    mode,
    token: token ? '***' + token.slice(-4) : null,
    hasChallenge: !!challenge,
  });

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[Webhook Verify] Verification successful');
    return new NextResponse(challenge, { status: 200 });
  }

  console.error('[Webhook Verify] Verification failed', {
    mode,
    tokenMatch: token === verifyToken,
  });

  return new NextResponse('Forbidden', { status: 403 });
}

/**
 * POST handler for Meta Cloud API WhatsApp webhook
 * Receives incoming messages and status updates from WhatsApp Business API
 *
 * Performance: Responds within 5 seconds to prevent Meta retries
 * Error Handling: Returns 200 OK for all scenarios to prevent retry storms
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('=== WEBHOOK CALLED ===', {
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method,
  });

  try {
    // Meta Cloud API sends JSON (not form data like Twilio)
    const body = await request.json();

    console.log('[Webhook] Received payload', {
      object: body.object,
      hasEntry: !!body.entry,
      entryCount: body.entry?.length || 0,
    });

    // Validate webhook is for WhatsApp Business Account
    if (body.object !== 'whatsapp_business_account') {
      console.warn('[Webhook] Invalid object type', { object: body.object });
      return NextResponse.json({ status: 'error', message: 'Invalid object type' }, { status: 400 });
    }

    // Process each entry (usually just one)
    const entries: WhatsAppWebhookEntry[] = body.entry || [];

    for (const entry of entries) {
      for (const change of entry.changes) {
        const value = change.value;

        console.log('[Webhook] Processing change', {
          field: change.field,
          hasMessages: !!value.messages,
          hasStatuses: !!value.statuses,
          messageCount: value.messages?.length || 0,
          statusCount: value.statuses?.length || 0,
        });

        // Handle incoming messages
        if (value.messages && value.messages.length > 0) {
          for (const message of value.messages) {
            const phoneNumber = message.from;
            const messageText = message.text?.body;
            const messageId = message.id;

            console.log('[Webhook] Incoming message', {
              from: phoneNumber.substring(0, 7) + 'X'.repeat(Math.max(0, phoneNumber.length - 7)),
              messageId,
              hasText: !!messageText,
              messageType: message.type,
            });

            if (messageText && phoneNumber && messageId) {
              // Normalize phone number: add + prefix if missing
              const normalizedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

              // Process message asynchronously
              void processMessageAsync(normalizedPhone, messageText, messageId).catch((error) => {
                console.error('CRITICAL: Unhandled error in async message processing', {
                  phoneNumber: normalizedPhone.substring(0, 7) + 'X'.repeat(Math.max(0, normalizedPhone.length - 7)),
                  messageId,
                  error: error instanceof Error ? error.message : 'Unknown error',
                  stack: error instanceof Error ? error.stack : undefined,
                });
              });
            }
          }
        }

        // Handle status updates (delivery receipts)
        if (value.statuses && value.statuses.length > 0) {
          for (const status of value.statuses) {
            console.log('[Webhook] Status update', {
              messageId: status.id,
              status: status.status,
            });

            void processStatusUpdateAsync(status.id, status.status);
          }
        }
      }
    }

    // Acknowledge webhook receipt immediately (Meta Cloud API expects JSON)
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('[Webhook] Error processing webhook', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return 200 OK even on errors to prevent Meta retries
    return NextResponse.json({ status: 'error' }, { status: 200 });
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

    // Generate AI response using OpenAI Service for ALL requests
    // The system prompt in OpenAI Service handles document generation flows
    try {
      console.log('DEBUG: Using OpenAIService for response', {
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
        historyCount: messageHistory.length,
      });

      // Always use OpenAI Service - the system prompt handles all document flows
      const openaiService = new OpenAIService();
      const aiResponse = await openaiService.generateResponse(messageText, {
        agentId: agentId || 'guest',
        messageHistory,
      });

      console.log('DEBUG: OpenAI generateResponse completed successfully');

      console.log('AI response generated', {
        agentId,
        messageId,
        responseLength: aiResponse.text.length,
        tokensUsed: aiResponse.tokensUsed.total,
        costEstimate: `$${aiResponse.costEstimate.toFixed(6)}`,
        responseTime: `${aiResponse.responseTime}ms`,
        isAssistantResponse: !!(aiResponse.threadId && aiResponse.assistantId),
        hasToolCalls: !!(aiResponse.toolCalls && aiResponse.toolCalls.length > 0),
      });

      // Handle calculator function calls
      let finalResponseText = aiResponse.text;
      if (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
        console.log('[Calculator] Function calls detected', {
          agentId,
          toolCallCount: aiResponse.toolCalls.length,
          functions: aiResponse.toolCalls.map(tc => tc.function.name),
        });

        const calculatorResults: string[] = [];

        for (const toolCall of aiResponse.toolCalls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          console.log('[Calculator] Executing function', {
            agentId,
            functionName,
            arguments: functionArgs,
          });

          // Handle calculator functions
          if (functionName === 'calculate_transfer_fees') {
            const result = CalculatorService.calculateTransferFees(functionArgs);
            if (result.success && result.result) {
              calculatorResults.push(result.result.formatted_output || result.result.summary);

              // Log to calculator_history
              if (agentId) {
                await supabase.from('calculator_history').insert({
                  agent_id: agentId,
                  calculator_id: (await supabase.from('calculators').select('id').eq('name', 'transfer_fees').single()).data?.id,
                  inputs_provided: functionArgs,
                  result_summary: result.result.summary,
                });
              }
            } else if (result.error) {
              calculatorResults.push(`Error: ${result.error.message}`);
            }
          } else if (functionName === 'calculate_capital_gains_tax') {
            const result = CalculatorService.calculateCapitalGainsTax(functionArgs);
            if (result.success && result.result) {
              calculatorResults.push(result.result.formatted_output || result.result.summary);

              // Log to calculator_history
              if (agentId) {
                await supabase.from('calculator_history').insert({
                  agent_id: agentId,
                  calculator_id: (await supabase.from('calculators').select('id').eq('name', 'capital_gains_tax').single()).data?.id,
                  inputs_provided: functionArgs,
                  result_summary: result.result.summary,
                });
              }
            } else if (result.error) {
              calculatorResults.push(`Error: ${result.error.message}`);
            }
          } else if (functionName === 'calculate_vat') {
            const result = CalculatorService.calculateVAT(functionArgs);
            if (result.success && result.result) {
              calculatorResults.push(result.result.formatted_output || result.result.summary);

              // Log to calculator_history
              if (agentId) {
                await supabase.from('calculator_history').insert({
                  agent_id: agentId,
                  calculator_id: (await supabase.from('calculators').select('id').eq('name', 'vat_calculator').single()).data?.id,
                  inputs_provided: functionArgs,
                  result_summary: result.result.summary,
                });
              }
            } else if (result.error) {
              calculatorResults.push(`Error: ${result.error.message}`);
            }
          } else if (functionName === 'list_calculators') {
            const calculatorsList = `📊 Available Calculators:

1️⃣ Transfer Fees Calculator
Calculate property transfer fees in Cyprus
Example: "Calculate transfer fees for €300,000"

2️⃣ Capital Gains Tax Calculator
Calculate capital gains tax on property sales
Example: "Calculate capital gains tax for property bought at €250k in 2015, selling at €400k in 2025"

3️⃣ VAT Calculator
Calculate VAT for houses and apartments
Example: "Calculate VAT for €350k apartment, first home"

Just ask me to calculate and I'll guide you through it!`;
            calculatorResults.push(calculatorsList);
          } else if (functionName === 'get_calculator_history') {
            if (!agentId) {
              calculatorResults.push('Calculator history is only available for registered agents. Please register first.');
            } else {
              const limit = Math.min(functionArgs.limit || 5, 10);
              const calculatorType = functionArgs.calculator_type;

              // Build query
              let query = supabase
                .from('calculator_history')
                .select(`
                  id,
                  created_at,
                  inputs_provided,
                  result_summary,
                  calculators(name, description)
                `)
                .eq('agent_id', agentId)
                .order('created_at', { ascending: false })
                .limit(limit);

              // Filter by calculator type if specified
              if (calculatorType) {
                const calcData = await supabase
                  .from('calculators')
                  .select('id')
                  .eq('name', calculatorType)
                  .single();

                if (calcData.data) {
                  query = query.eq('calculator_id', calcData.data.id);
                }
              }

              const { data: history, error: historyError } = await query;

              if (historyError || !history || history.length === 0) {
                calculatorResults.push('No calculation history found.');
              } else {
                const historyText = ['📜 Your Recent Calculations:\n'];

                history.forEach((item, index) => {
                  const date = new Date(item.created_at);
                  const formattedDate = date.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const calcName = (item.calculators as { name?: string })?.name || 'Unknown';
                  const calcLabel = calcName === 'transfer_fees' ? 'Transfer Fees' :
                                   calcName === 'capital_gains_tax' ? 'Capital Gains Tax' :
                                   calcName === 'vat_calculator' ? 'VAT' : calcName;

                  historyText.push(`${index + 1}. ${formattedDate} - ${calcLabel}`);
                  historyText.push(`   Result: ${item.result_summary}`);
                  historyText.push('');
                });

                calculatorResults.push(historyText.join('\n'));
              }
            }
          }
        }

        // Combine AI response with calculator results
        if (calculatorResults.length > 0) {
          if (finalResponseText) {
            finalResponseText = `${finalResponseText}\n\n${calculatorResults.join('\n\n')}`;
          } else {
            finalResponseText = calculatorResults.join('\n\n');
          }
        }

        console.log('[Calculator] Functions executed', {
          agentId,
          resultsCount: calculatorResults.length,
        });
      }

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

      // Send WhatsApp reply using Meta Cloud API service
      const whatsappService = new WhatsAppMetaService({ supabaseClient: supabase });
      const sendResult = await whatsappService.sendMessage(
        { phoneNumber, messageText: finalResponseText },
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
        const whatsappService = new WhatsAppMetaService({ supabaseClient: supabase });
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

