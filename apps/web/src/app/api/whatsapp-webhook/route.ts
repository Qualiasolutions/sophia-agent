import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { OpenAIService, WhatsAppService, CalculatorService, OptimizedDocumentService } from '@sophiaai/services';

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

    // Check if this is a document generation request
    const isDocumentRequest = detectDocumentRequest(messageText);

    // Generate AI response using optimized service for documents, regular OpenAI for chat
    try {
      console.log('DEBUG: Determining response service', {
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
        historyCount: messageHistory.length,
        isDocumentRequest,
      });

      let aiResponse;

      if (isDocumentRequest) {
        // Use optimized document generation service
        console.log('DEBUG: Using OptimizedDocumentService for document generation');

        const optimizedService = new OptimizedDocumentService(
          process.env.OPENAI_API_KEY!,
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const documentResponse = await optimizedService.generateDocument({
          message: messageText,
          agentId: agentId || undefined,
          sessionId: messageId,
          context: { platform: 'whatsapp', phoneNumber }
        });

        aiResponse = {
          text: documentResponse.content,
          tokensUsed: { total: documentResponse.tokensUsed },
          responseTime: documentResponse.processingTime,
          costEstimate: calculateCost(documentResponse.tokensUsed),
          threadId: null,
          assistantId: null,
          runId: null,
          toolCalls: []
        };

        console.log('DEBUG: Optimized document generation completed', {
          templateId: documentResponse.templateId,
          processingTime: documentResponse.processingTime,
          tokensUsed: documentResponse.tokensUsed,
          confidence: documentResponse.confidence
        });

        // Log document generation to database
        if (agentId) {
          try {
            await supabase.from('optimized_document_generations').insert({
              agent_id: agentId,
              template_id: documentResponse.templateId,
              template_name: documentResponse.templateName,
              category: documentResponse.metadata.category,
              processing_time_ms: documentResponse.processingTime,
              tokens_used: documentResponse.tokensUsed,
              confidence: documentResponse.confidence,
              original_request: messageText,
              generated_content: documentResponse.content,
              session_id: messageId,
              created_at: new Date().toISOString()
            });
          } catch (logError) {
            console.error('Failed to log optimized document generation:', logError);
          }
        }

      } else {
        // Use regular OpenAI service for chat (faster than Assistant API)
        console.log('DEBUG: Using OpenAIService for chat response');

        const openaiService = new OpenAIService();
        aiResponse = await openaiService.generateResponse(messageText, {
          agentId: agentId || 'guest',
          messageHistory,
        });

        console.log('DEBUG: OpenAI generateResponse completed successfully');
      }

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

      // Send WhatsApp reply using WhatsApp service
      const whatsappService = new WhatsAppService({ supabaseClient: supabase });
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

/**
 * Detect if a message is requesting document generation
 */
function detectDocumentRequest(message: string): boolean {
  const documentKeywords = [
    'template', 'document', 'form', 'agreement', 'registration', 'email',
    'generate', 'create', 'need', 'draft', 'prepare', 'write', 'make',
    'seller', 'buyer', 'client', 'viewing', 'marketing', 'social media',
    'cra', 'contract', 'listing', 'appointment', 'notice', 'letter'
  ];

  const normalizedMessage = message.toLowerCase().trim();

  // Check for document keywords
  const hasDocumentKeyword = documentKeywords.some(keyword =>
    normalizedMessage.includes(keyword)
  );

  // Check for common document request patterns
  const documentPatterns = [
    /i need \w+ (template|form|document)/i,
    /generate \w+ (email|agreement|notice)/i,
    /create \w+ (document|template|form)/i,
    /prepare \w+ (agreement|contract|letter)/i,
    /draft \w+ (email|notice|document)/i,
    /write \w+ (email|letter|template)/i,
    /make \w+ (form|document|template)/i,
    /seller registration/i,
    /buyer registration/i,
    /viewing form/i,
    /marketing agreement/i,
    /social media/i,
    /good client request/i,
    /phone call required/i
  ];

  const matchesPattern = documentPatterns.some(pattern =>
    pattern.test(normalizedMessage)
  );

  return hasDocumentKeyword || matchesPattern;
}

/**
 * Calculate estimated cost based on token usage
 */
function calculateCost(tokens: number): number {
  // GPT-4o-mini pricing: $0.15 per 1M input tokens, $0.6 per 1M output tokens
  const inputCost = (tokens * 0.6) / 1000000; // Assume 60% input tokens
  const outputCost = (tokens * 0.4) / 1000000 * 0.6; // 40% output tokens
  return inputCost + outputCost;
}
