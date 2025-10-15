#!/usr/bin/env node

/**
 * Test Telegram Bot with Real Message Format
 * Simulates exactly what Telegram sends to your webhook
 */

const webhookUrl = 'https://sophia-agent.vercel.app/api/telegram-webhook';
const webhookSecret = 'sophiaai-telegram-webhook-secret-2025';

// Real Telegram message format
const realTelegramPayload = {
  update_id: Date.now(),
  message: {
    message_id: Math.floor(Math.random() * 10000),
    from: {
      id: 999999999, // Test user ID (different from bot ID)
      is_bot: false,
      first_name: "Test",
      last_name: "User",
      username: "testuser123",
      language_code: "en"
    },
    chat: {
      id: 999999999, // Same as user ID for private chat
      first_name: "Test",
      last_name: "User",
      username: "testuser123",
      type: "private"
    },
    date: Math.floor(Date.now() / 1000),
    text: "Hello Sophia! I need help with a seller registration"
  }
};

async function testRealTelegramMessage() {
  console.log('🧪 Testing with real Telegram message format...');
  console.log(`📤 Sending to: ${webhookUrl}`);
  console.log(`👤 User ID: ${realTelegramPayload.message.from.id}`);
  console.log(`💬 Message: ${realTelegramPayload.message.text}`);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Bot-Api-Secret-Token': webhookSecret
      },
      body: JSON.stringify(realTelegramPayload)
    });

    const responseText = await response.text();

    console.log(`\n📊 Response Status: ${response.status}`);
    console.log(`📄 Response Body: ${responseText}`);

    if (response.status === 200) {
      console.log('✅ Webhook accepted message successfully!');

      // Check if bot tries to send a response
      console.log('\n🔍 Checking if bot attempted to respond...');
      console.log('⏳ Waiting 3 seconds for processing...');

      setTimeout(async () => {
        // Check recent messages to see if bot responded
        try {
          const updatesResponse = await fetch(`https://api.telegram.org/bot7366078137:AAF49KYdNYZKAbMQQ_42bbltU3oCChrs5qM/getUpdates?offset=-1&limit=1`);
          const updatesData = await updatesResponse.json();

          if (updatesData.ok && updatesData.result.length > 0) {
            console.log('✅ Bot may have sent a response (check Telegram)');
          } else {
            console.log('❌ No bot response detected');
          }
        } catch (error) {
          console.log('⚠️ Could not check for bot response');
        }
      }, 3000);

    } else {
      console.log('❌ Webhook rejected message');
    }
  } catch (error) {
    console.error('❌ Error testing webhook:', error.message);
  }
}

testRealTelegramMessage();