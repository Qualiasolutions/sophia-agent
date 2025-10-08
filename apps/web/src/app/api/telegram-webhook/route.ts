/**
 * Telegram Webhook Handler
 * Story 6.1: Telegram Bot Setup & Webhook Integration
 * Story 6.2: Telegram User Authentication & Registration
 * Story 6.3: Telegram Message Forwarding
 * Story 6.4: Conversational Features
 *
 * Receives updates from Telegram Bot API and processes messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { TelegramUpdate } from '@sophiaai/shared';
import {
  getTelegramService,
  TelegramService,
  getTelegramAuthService,
  TelegramAuthService,
  getMessageForwardService,
  MessageForwardService,
  getTelegramRateLimiter,
  createLogger,
  getMetricsService,
  OptimizedDocumentService,
  OpenAIService,
} from '@sophiaai/services';
import { createClient } from '@supabase/supabase-js';

const logger = createLogger('TelegramWebhook');
const metrics = getMetricsService();

const WEBHOOK_SECRET_TOKEN = process.env.TELEGRAM_WEBHOOK_SECRET || 'default-secret-token';

// Store registration state (in production, use Redis or database)
const registrationState = new Map<number, 'awaiting_email' | 'completed'>();

// Rate limiter instance
const rateLimiter = getTelegramRateLimiter();

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify webhook signature for security
    const secretToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token');

    if (!TelegramService.validateWebhookSignature(WEBHOOK_SECRET_TOKEN, secretToken || undefined)) {
      logger.warn('Invalid webhook signature', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse incoming update
    const update: TelegramUpdate = await request.json();

    logger.info('Webhook received', {
      updateId: update.update_id,
      userId: update.message?.from?.id?.toString() ?? undefined,
    });

    metrics.trackRequest('telegram');

    // Extract user ID for rate limiting
    const userId = update.message?.from?.id || update.edited_message?.from?.id;

    if (userId) {
      // Check rate limit
      const rateLimit = rateLimiter.checkLimit(userId.toString());

      if (!rateLimit.allowed) {
        const resetIn = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
        logger.warn('Rate limit exceeded', {
          userId: userId?.toString() ?? undefined,
          resetIn,
          updateId: update.update_id,
        });

        metrics.trackRateLimit('telegram');

        // Send rate limit message to user
        const chatId = update.message?.chat.id || update.edited_message?.chat.id;
        if (chatId) {
          await getTelegramService().sendMessage(
            chatId,
            `⏱️ *Rate limit exceeded*\n\nPlease wait ${resetIn} seconds before sending more messages.`,
            { parse_mode: 'Markdown' }
          ).catch(err => console.error('Failed to send rate limit message:', err));
        }

        return NextResponse.json({ ok: true }); // Still return 200 to acknowledge webhook
      }

      logger.debug('Rate limit check passed', {
        userId: userId?.toString(),
        remaining: rateLimit.remaining,
      });
    }

    // Process message asynchronously (don't block webhook response)
    processUpdate(update).catch((error) => {
      logger.error('Error processing update async', {
        updateId: update.update_id,
        error: error instanceof Error ? error.message : String(error),
      });
    });

    // Respond immediately to Telegram (within 60 seconds requirement)
    const responseTime = Date.now() - startTime;
    logger.trackPerformance('webhook_response_time', responseTime, {
      updateId: update.update_id,
    });
    metrics.trackPerformance('webhookResponseTime', responseTime);

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error('Webhook error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    metrics.trackError('telegram');

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Process Telegram update asynchronously
 */
async function processUpdate(update: TelegramUpdate): Promise<void> {
  const startTime = Date.now();
  const message = update.message;

  if (!message || !message.from) {
    logger.debug('No message or sender in update', {
      updateId: update.update_id,
    });
    return;
  }

  const chatId = message.chat.id;
  const text = message.text?.trim();
  const userId = message.from.id;
  const username = message.from.username;
  const firstName = message.from.first_name;
  const lastName = message.from.last_name;

  logger.info('Processing message', {
    userId: userId.toString(),
    username,
    chatId,
    messageLength: text?.length || 0,
  });

  metrics.trackActiveUser(userId.toString());

  if (!text) {
    return;
  }

  try {
    // Story 6.2: Check if user is registered
    const isRegistered = await getTelegramAuthService().isUserRegistered(userId);

    if (!isRegistered) {
      // Handle registration flow
      const state = registrationState.get(userId);

      if (state === 'awaiting_email') {
        // User is providing their email
        if (!TelegramAuthService.validateEmail(text)) {
          await getTelegramService().sendMessage(
            chatId,
            '❌ Invalid email format. Please provide a valid email address registered with Sophia.',
            { parse_mode: 'Markdown' }
          );
          return;
        }

        // Check if agent exists with this email
        const agent = await getTelegramAuthService().getAgentByEmail(text);

        if (!agent) {
          await getTelegramService().sendMessage(
            chatId,
            `❌ No active agent found with email: ${text}\n\nPlease make sure you're registered as an agent with Sophia first, or contact your administrator.`,
            { parse_mode: 'Markdown' }
          );
          registrationState.delete(userId);
          return;
        }

        // Register the Telegram user
        await getTelegramAuthService().registerTelegramUser({
          telegramUserId: userId,
          chatId,
          agentId: agent.id,
          username,
          firstName,
          lastName,
        });

        logger.trackEvent('user_registered', {
          userId: userId.toString(),
          agentId: agent.id,
          email: text,
        });

        metrics.trackRegistration();

        registrationState.set(userId, 'completed');

        await getTelegramService().sendMessage(
          chatId,
          `✅ *Registration successful!*\n\nWelcome to Sophia AI, ${firstName}!\n\nYou can now:\n• Get AI-powered assistance\n• Generate documents\n• Use calculators\n• Forward messages to WhatsApp\n\nJust send me a message and I'll help you! 🚀`,
          { parse_mode: 'Markdown' }
        );

        registrationState.delete(userId);
        return;
      } else {
        // Start registration
        registrationState.set(userId, 'awaiting_email');

        await getTelegramService().sendMessage(
          chatId,
          `👋 *Welcome to Sophia AI!*\n\nTo get started, please provide your registered email address.\n\nExample: john@zyprus.com`,
          { parse_mode: 'Markdown' }
        );
        return;
      }
    }

    // User is registered - update last active
    await getTelegramAuthService().updateLastActive(userId);

    // Get user's agent ID for forwarding
    const telegramUser = await getTelegramAuthService().getTelegramUser(userId);
    if (!telegramUser) {
      throw new Error('Telegram user not found after registration check');
    }

    // Story 6.3: Detect and process forward commands
    const forwardParsed = MessageForwardService.parseForwardCommand(text);

    if (forwardParsed.isForwardCommand) {
      if (!forwardParsed.recipient || !forwardParsed.message) {
        await getTelegramService().sendMessage(
          chatId,
          `❌ Invalid forward command format.\n\nUse one of these formats:\n• \`forward to +35799123456: Your message\`\n• \`/forward +35799123456 Your message\``,
          { parse_mode: 'Markdown' }
        );
        return;
      }

      // Validate phone number
      if (!MessageForwardService.validatePhoneNumber(forwardParsed.recipient)) {
        await getTelegramService().sendMessage(
          chatId,
          `❌ Invalid phone number format.\n\nPlease use international format, e.g., +35799123456`,
          { parse_mode: 'Markdown' }
        );
        return;
      }

      // Forward the message
      await getTelegramService().sendMessage(
        chatId,
        `📤 Forwarding message to ${forwardParsed.recipient}...`,
        { parse_mode: 'Markdown' }
      );

      const result = await getMessageForwardService().forwardToWhatsApp({
        agentId: telegramUser.agent_id,
        telegramChatId: chatId.toString(),
        recipientPhone: forwardParsed.recipient,
        message: forwardParsed.message,
        messageType: 'text',
      });

      logger.trackEvent('message_forwarded', {
        userId: userId.toString(),
        agentId: telegramUser.agent_id,
        success: result.success,
        destination: forwardParsed.recipient,
      });

      metrics.trackMessageForward(result.success);

      if (result.success) {
        await getTelegramService().sendMessage(
          chatId,
          `✅ Message forwarded successfully to ${forwardParsed.recipient} via WhatsApp!`,
          { parse_mode: 'Markdown' }
        );
      } else {
        await getTelegramService().sendMessage(
          chatId,
          `❌ Failed to forward message: ${result.error}\n\nPlease try again later.`,
          { parse_mode: 'Markdown' }
        );
      }

      return;
    }

    // Story 6.4: Generate AI responses with optimized service

    // Log incoming message
    await logConversation({
      agentId: telegramUser.agent_id,
      direction: 'inbound',
      messageContent: text,
      platform: 'telegram',
      telegramChatId: chatId,
      telegramMessageId: message.message_id,
    });

    // Check if this is a document generation request
    const isDocumentRequest = detectDocumentRequest(text);

    const aiStartTime = Date.now();
    let aiResponse: string;
    let aiDuration: number;

    if (isDocumentRequest) {
      // Use optimized document generation service
      logger.info('Using OptimizedDocumentService for document generation', {
        agentId: telegramUser.agent_id,
        message: text.substring(0, 50) + '...'
      });

      const optimizedService = new OptimizedDocumentService(
        process.env.OPENAI_API_KEY!,
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const documentResponse = await optimizedService.generateDocument({
        message: text,
        agentId: telegramUser.agent_id,
        sessionId: message.message_id.toString(),
        context: { platform: 'telegram', chatId: chatId.toString() }
      });

      aiResponse = documentResponse.content;
      aiDuration = Date.now() - aiStartTime;

      logger.info('Optimized document generation completed', {
        agentId: telegramUser.agent_id,
        templateId: documentResponse.templateId,
        processingTime: documentResponse.processingTime,
        tokensUsed: documentResponse.tokensUsed,
        confidence: documentResponse.confidence
      });

      // Log document generation to database
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        await supabase.from('optimized_document_generations').insert({
          agent_id: telegramUser.agent_id,
          template_id: documentResponse.templateId,
          template_name: documentResponse.templateName,
          category: documentResponse.metadata.category,
          processing_time_ms: documentResponse.processingTime,
          tokens_used: documentResponse.tokensUsed,
          confidence: documentResponse.confidence,
          original_request: text,
          generated_content: documentResponse.content,
          session_id: message.message_id.toString(),
          created_at: new Date().toISOString()
        });

        logger.info('Document generation logged successfully', {
          agentId: telegramUser.agent_id,
          templateId: documentResponse.templateId
        });
      } catch (logError) {
        logger.error('Failed to log optimized document generation', {
          agentId: telegramUser.agent_id,
          error: logError instanceof Error ? logError.message : 'Unknown error'
        });
      }

    } else {
      // Use regular OpenAI service for chat (faster than AssistantService)
      logger.info('Using OpenAIService for chat response', {
        agentId: telegramUser.agent_id,
        message: text.substring(0, 50) + '...'
      });

      const openaiService = new OpenAIService();
      const response = await openaiService.generateResponse(text, {
        agentId: telegramUser.agent_id,
        messageHistory: [] // TODO: Load conversation history for context
      });

      aiResponse = response.text;
      aiDuration = Date.now() - aiStartTime;
    }
    logger.trackPerformance('ai_response_generation', aiDuration, {
      userId: userId.toString(),
      agentId: telegramUser.agent_id,
      messageLength: text.length,
      responseLength: aiResponse.length,
    });

    metrics.trackPerformance('aiResponseTime', aiDuration);

    // Send AI response
    await getTelegramService().sendMessage(
      chatId,
      aiResponse,
      { parse_mode: 'Markdown' }
    );

    // Log outgoing message
    await logConversation({
      agentId: telegramUser.agent_id,
      direction: 'outbound',
      messageContent: aiResponse,
      platform: 'telegram',
      telegramChatId: chatId,
    });

    const processingDuration = Date.now() - startTime;
    logger.trackPerformance('message_processing_complete', processingDuration, {
      userId: userId.toString(),
      chatId,
    });

    metrics.trackPerformance('messageProcessingTime', processingDuration);
  } catch (error) {
    logger.error('Error processing message', {
      userId: userId.toString(),
      chatId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    metrics.trackError('telegram');

    await getTelegramService().sendMessage(
      chatId,
      '❌ An error occurred processing your message. Please try again later.',
      { parse_mode: 'Markdown' }
    ).catch(err => {
      logger.error('Failed to send error message', {
        userId: userId.toString(),
        chatId,
        error: err instanceof Error ? err.message : String(err),
      });
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
 * Log conversation to database
 */
async function logConversation(params: {
  agentId: string;
  direction: 'inbound' | 'outbound';
  messageContent: string;
  platform: 'telegram' | 'whatsapp';
  telegramChatId?: number;
  telegramMessageId?: number;
}): Promise<void> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase.from('conversation_logs').insert({
      agent_id: params.agentId,
      direction: params.direction,
      message_text: params.messageContent, // Changed from message_content to message_text
      telegram_chat_id: params.telegramChatId,
      telegram_message_id: params.telegramMessageId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log conversation:', error);
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Telegram webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
