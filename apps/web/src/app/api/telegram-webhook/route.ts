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
  telegramService,
  TelegramService,
  telegramAuthService,
  TelegramAuthService,
  messageForwardService,
  MessageForwardService,
  getAssistantService,
  getTelegramRateLimiter,
} from '@sophiaai/services';
import { createClient } from '@supabase/supabase-js';

const WEBHOOK_SECRET_TOKEN = process.env.TELEGRAM_WEBHOOK_SECRET || 'default-secret-token';

// Store registration state (in production, use Redis or database)
const registrationState = new Map<number, 'awaiting_email' | 'completed'>();

// Rate limiter instance
const rateLimiter = getTelegramRateLimiter();

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature for security
    const secretToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token');

    if (!TelegramService.validateWebhookSignature(WEBHOOK_SECRET_TOKEN, secretToken || undefined)) {
      console.warn('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse incoming update
    const update: TelegramUpdate = await request.json();

    // Extract user ID for rate limiting
    const userId = update.message?.from?.id || update.edited_message?.from?.id;

    if (userId) {
      // Check rate limit
      const rateLimit = rateLimiter.checkLimit(userId.toString());

      if (!rateLimit.allowed) {
        const resetIn = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
        console.warn(`Rate limit exceeded for user ${userId}, resets in ${resetIn}s`);

        // Send rate limit message to user
        const chatId = update.message?.chat.id || update.edited_message?.chat.id;
        if (chatId) {
          await telegramService.sendMessage(
            chatId,
            `⏱️ *Rate limit exceeded*\n\nPlease wait ${resetIn} seconds before sending more messages.`,
            { parse_mode: 'Markdown' }
          ).catch(err => console.error('Failed to send rate limit message:', err));
        }

        return NextResponse.json({ ok: true }); // Still return 200 to acknowledge webhook
      }

      console.log(`Rate limit: ${rateLimit.remaining} remaining for user ${userId}`);
    }

    console.log('Received Telegram update:', update.update_id);

    // Process message asynchronously (don't block webhook response)
    processUpdate(update).catch((error) => {
      console.error('Error processing Telegram update:', error);
    });

    // Respond immediately to Telegram (within 60 seconds requirement)
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
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
  const message = update.message;

  if (!message || !message.from) {
    console.log('No message or sender in update, skipping');
    return;
  }

  const chatId = message.chat.id;
  const text = message.text?.trim();
  const userId = message.from.id;
  const username = message.from.username;
  const firstName = message.from.first_name;
  const lastName = message.from.last_name;

  console.log(`Message from ${username} (${userId}): ${text}`);

  if (!text) {
    return;
  }

  try {
    // Story 6.2: Check if user is registered
    const isRegistered = await telegramAuthService.isUserRegistered(userId);

    if (!isRegistered) {
      // Handle registration flow
      const state = registrationState.get(userId);

      if (state === 'awaiting_email') {
        // User is providing their email
        if (!TelegramAuthService.validateEmail(text)) {
          await telegramService.sendMessage(
            chatId,
            '❌ Invalid email format. Please provide a valid email address registered with Sophia.',
            { parse_mode: 'Markdown' }
          );
          return;
        }

        // Check if agent exists with this email
        const agent = await telegramAuthService.getAgentByEmail(text);

        if (!agent) {
          await telegramService.sendMessage(
            chatId,
            `❌ No active agent found with email: ${text}\n\nPlease make sure you're registered as an agent with Sophia first, or contact your administrator.`,
            { parse_mode: 'Markdown' }
          );
          registrationState.delete(userId);
          return;
        }

        // Register the Telegram user
        await telegramAuthService.registerTelegramUser({
          telegramUserId: userId,
          chatId,
          agentId: agent.id,
          username,
          firstName,
          lastName,
        });

        registrationState.set(userId, 'completed');

        await telegramService.sendMessage(
          chatId,
          `✅ *Registration successful!*\n\nWelcome to Sophia AI, ${firstName}!\n\nYou can now:\n• Get AI-powered assistance\n• Generate documents\n• Use calculators\n• Forward messages to WhatsApp\n\nJust send me a message and I'll help you! 🚀`,
          { parse_mode: 'Markdown' }
        );

        registrationState.delete(userId);
        return;
      } else {
        // Start registration
        registrationState.set(userId, 'awaiting_email');

        await telegramService.sendMessage(
          chatId,
          `👋 *Welcome to Sophia AI!*\n\nTo get started, please provide your registered email address.\n\nExample: john@zyprus.com`,
          { parse_mode: 'Markdown' }
        );
        return;
      }
    }

    // User is registered - update last active
    await telegramAuthService.updateLastActive(userId);

    // Get user's agent ID for forwarding
    const telegramUser = await telegramAuthService.getTelegramUser(userId);
    if (!telegramUser) {
      throw new Error('Telegram user not found after registration check');
    }

    // Story 6.3: Detect and process forward commands
    const forwardParsed = MessageForwardService.parseForwardCommand(text);

    if (forwardParsed.isForwardCommand) {
      if (!forwardParsed.recipient || !forwardParsed.message) {
        await telegramService.sendMessage(
          chatId,
          `❌ Invalid forward command format.\n\nUse one of these formats:\n• \`forward to +35799123456: Your message\`\n• \`/forward +35799123456 Your message\``,
          { parse_mode: 'Markdown' }
        );
        return;
      }

      // Validate phone number
      if (!MessageForwardService.validatePhoneNumber(forwardParsed.recipient)) {
        await telegramService.sendMessage(
          chatId,
          `❌ Invalid phone number format.\n\nPlease use international format, e.g., +35799123456`,
          { parse_mode: 'Markdown' }
        );
        return;
      }

      // Forward the message
      await telegramService.sendMessage(
        chatId,
        `📤 Forwarding message to ${forwardParsed.recipient}...`,
        { parse_mode: 'Markdown' }
      );

      const result = await messageForwardService.forwardToWhatsApp({
        agentId: telegramUser.agent_id,
        telegramChatId: chatId.toString(),
        recipientPhone: forwardParsed.recipient,
        message: forwardParsed.message,
        messageType: 'text',
      });

      if (result.success) {
        await telegramService.sendMessage(
          chatId,
          `✅ Message forwarded successfully to ${forwardParsed.recipient} via WhatsApp!`,
          { parse_mode: 'Markdown' }
        );
      } else {
        await telegramService.sendMessage(
          chatId,
          `❌ Failed to forward message: ${result.error}\n\nPlease try again later.`,
          { parse_mode: 'Markdown' }
        );
      }

      return;
    }

    // Story 6.4: Generate AI responses with OpenAI

    // Log incoming message
    await logConversation({
      agentId: telegramUser.agent_id,
      direction: 'inbound',
      messageContent: text,
      platform: 'telegram',
      telegramChatId: chatId,
      telegramMessageId: message.message_id,
    });

    // Generate AI response using OpenAI Assistant
    const assistantService = getAssistantService();
    const response = await assistantService.generateDocument(
      telegramUser.agent_id,
      text,
      [] // TODO: Load conversation history for context
    );
    const aiResponse = response.text;

    // Send AI response
    await telegramService.sendMessage(
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
  } catch (error) {
    console.error('Error processing Telegram update:', error);

    await telegramService.sendMessage(
      chatId,
      '❌ An error occurred processing your message. Please try again later.',
      { parse_mode: 'Markdown' }
    ).catch(console.error);
  }
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
      message_content: params.messageContent,
      platform: params.platform,
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
