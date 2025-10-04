/**
 * Telegram Webhook Handler
 * Story 6.1: Telegram Bot Setup & Webhook Integration
 *
 * Receives updates from Telegram Bot API and processes messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { TelegramUpdate } from '@sophiaai/shared/types/telegram';
import { telegramService, TelegramService } from '@sophiaai/services/telegram.service';

const WEBHOOK_SECRET_TOKEN = process.env.TELEGRAM_WEBHOOK_SECRET || 'default-secret-token';

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

  if (!message) {
    console.log('No message in update, skipping');
    return;
  }

  const chatId = message.chat.id;
  const text = message.text;
  const userId = message.from?.id;
  const username = message.from?.username;

  console.log(`Message from ${username} (${userId}): ${text}`);

  // Story 6.1: Simple echo for testing
  if (text) {
    try {
      await telegramService.sendMessage(
        chatId,
        `Echo: ${text}\n\n_Sophia AI is now connected!_`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      console.error('Failed to send Telegram message:', error);
    }
  }

  // TODO: Story 6.2 - Check if user is registered
  // TODO: Story 6.3 - Detect and process forward commands
  // TODO: Story 6.4 - Generate AI responses with OpenAI
}

export async function GET() {
  return NextResponse.json({
    status: 'Telegram webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
