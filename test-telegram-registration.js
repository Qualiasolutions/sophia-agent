#!/usr/bin/env node

/**
 * Test Telegram Registration Flow
 * Simulates the exact registration flow for your user ID
 */

const webhookUrl = 'https://sophia-agent.vercel.app/api/telegram-webhook';
const webhookSecret = 'sophiaai-telegram-webhook-secret-2025';

// Your actual user ID from the logs
const YOUR_USER_ID = 7894947182;
const YOUR_CHAT_ID = 7894947182;

// Registration flow test
async function testRegistrationFlow() {
  console.log('🧪 Testing Telegram registration flow...');
  console.log(`👤 Your User ID: ${YOUR_USER_ID}`);
  console.log(`💬 Chat ID: ${YOUR_CHAT_ID}`);

  // Step 1: Send first message (should trigger registration prompt)
  console.log('\n📤 Step 1: Sending "hello" message...');

  const firstMessage = {
    update_id: Date.now(),
    message: {
      message_id: Math.floor(Math.random() * 10000),
      from: {
        id: YOUR_USER_ID,
        is_bot: false,
        first_name: "User",
        username: "user_" + Math.random().toString(36).substr(2, 9)
      },
      chat: {
        id: YOUR_CHAT_ID,
        type: "private"
      },
      date: Math.floor(Date.now() / 1000),
      text: "hello"
    }
  };

  try {
    const response1 = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Bot-Api-Secret-Token': webhookSecret
      },
      body: JSON.stringify(firstMessage)
    });

    console.log(`📊 Response: ${response1.status} - ${await response1.text()}`);

    if (response1.status === 200) {
      console.log('✅ First message accepted! Bot should send registration prompt.');

      // Wait a moment for processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Send email (you would need to provide your actual agent email)
      console.log('\n📤 Step 2: Testing with sample email...');

      const emailMessage = {
        update_id: Date.now() + 1,
        message: {
          message_id: Math.floor(Math.random() * 10000),
          from: {
            id: YOUR_USER_ID,
            is_bot: false,
            first_name: "User",
            username: "user_" + Math.random().toString(36).substr(2, 9)
          },
          chat: {
            id: YOUR_CHAT_ID,
            type: "private"
          },
          date: Math.floor(Date.now() / 1000),
          text: "user@zyprus.com" // Replace with your actual agent email
        }
      };

      const response2 = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Bot-Api-Secret-Token': webhookSecret
        },
        body: JSON.stringify(emailMessage)
      });

      console.log(`📊 Email response: ${response2.status} - ${await response2.text()}`);

      if (response2.status === 200) {
        console.log('✅ Registration flow completed!');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRegistrationFlow();