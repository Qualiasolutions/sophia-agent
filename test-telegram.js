#!/usr/bin/env node

/**
 * Test Telegram Bot Webhook
 * Sends a test webhook payload to the deployed bot
 */

const webhookUrl = 'https://sophia-agent.vercel.app/api/telegram-webhook';
const webhookSecret = 'sophiaai-telegram-webhook-secret-2025';

// Test message payload
const testPayload = {
  update_id: 123456789,
  message: {
    message_id: 1,
    from: {
      id: 999999999, // Test user ID (not real)
      is_bot: false,
      first_name: "Test",
      last_name: "User",
      username: "testuser",
      language_code: "en"
    },
    chat: {
      id: 999999999,
      first_name: "Test",
      last_name: "User",
      username: "testuser",
      type: "private"
    },
    date: Math.floor(Date.now() / 1000),
    text: "Hello Sophia! Can you help me generate a seller registration document?"
  }
};

async function testTelegramWebhook() {
  console.log('🧪 Testing Telegram webhook...');

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Bot-Api-Secret-Token': webhookSecret
      },
      body: JSON.stringify(testPayload)
    });

    console.log(`Status: ${response.status}`);
    console.log(`Response: ${await response.text()}`);

    if (response.status === 200) {
      console.log('✅ Webhook test successful!');
    } else {
      console.log('❌ Webhook test failed');
    }
  } catch (error) {
    console.error('❌ Error testing webhook:', error.message);
  }
}

testTelegramWebhook();