#!/usr/bin/env ts-node
/**
 * Setup Telegram Webhook
 * Registers the webhook URL with Telegram Bot API
 *
 * Usage: TELEGRAM_BOT_TOKEN=xxx WEBHOOK_URL=xxx ts-node scripts/setup-telegram-webhook.ts
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://sophia-agent.vercel.app/api/telegram-webhook';
const SECRET_TOKEN = process.env.TELEGRAM_WEBHOOK_SECRET || 'sophiaai-telegram-webhook-secret-2025';

async function setupWebhook() {
  if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN environment variable is required');
    process.exit(1);
  }

  console.log('🔧 Setting up Telegram webhook...');
  console.log(`📍 Webhook URL: ${WEBHOOK_URL}`);

  try {
    // Set webhook
    const setWebhookUrl = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`;
    const response = await fetch(setWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        secret_token: SECRET_TOKEN,
        allowed_updates: ['message', 'callback_query'],
      }),
    });

    const data = await response.json();

    if (data.ok) {
      console.log('✅ Webhook registered successfully!');
    } else {
      console.error('❌ Failed to register webhook:', data.description);
      process.exit(1);
    }

    // Get webhook info to verify
    const getInfoUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`;
    const infoResponse = await fetch(getInfoUrl);
    const infoData = await infoResponse.json();

    if (infoData.ok) {
      console.log('\n📊 Webhook Info:');
      console.log(`   URL: ${infoData.result.url}`);
      console.log(`   Has custom certificate: ${infoData.result.has_custom_certificate}`);
      console.log(`   Pending update count: ${infoData.result.pending_update_count}`);
      if (infoData.result.last_error_message) {
        console.log(`   ⚠️  Last error: ${infoData.result.last_error_message}`);
      }
    }

    console.log('\n✨ Telegram bot is ready to receive messages!');
    console.log('   Send a message to your bot to test the echo functionality.');
  } catch (error) {
    console.error('❌ Error setting up webhook:', error);
    process.exit(1);
  }
}

setupWebhook();
