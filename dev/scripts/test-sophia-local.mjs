#!/usr/bin/env node

/**
 * Local Test Script for Sophia AI
 * Tests all document generation flows without WhatsApp
 *
 * Usage: node dev/scripts/test-sophia-local.mjs
 */

import { OpenAIService } from '../../packages/services/src/openai.service.ts';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

function separator() {
  console.log(colors.cyan + '='.repeat(80) + colors.reset);
}

function testHeader(title) {
  console.log('\n');
  separator();
  log(colors.bright + colors.blue, `🧪 TEST: ${title}`);
  separator();
}

function userMessage(msg) {
  log(colors.green, `👤 USER: ${msg}`);
}

function sophiaMessage(msg) {
  log(colors.yellow, `🤖 SOPHIA: ${msg}`);
}

function errorMessage(msg) {
  log(colors.red, `❌ ERROR: ${msg}`);
}

function successMessage(msg) {
  log(colors.green, `✅ SUCCESS: ${msg}`);
}

function infoMessage(msg) {
  log(colors.cyan, `ℹ️  INFO: ${msg}`);
}

// Simulate a conversation with history
async function simulateConversation(openaiService, messages) {
  const messageHistory = [];

  for (const userMsg of messages) {
    userMessage(userMsg);

    try {
      const response = await openaiService.generateResponse(userMsg, {
        agentId: 'test-agent',
        messageHistory,
      });

      sophiaMessage(response.text);

      // Add to history
      messageHistory.push({ role: 'user', content: userMsg });
      messageHistory.push({ role: 'assistant', content: response.text });

      // Show metrics
      infoMessage(`Tokens: ${response.tokensUsed.total} | Cost: $${response.costEstimate.toFixed(6)} | Time: ${response.responseTime}ms`);

      console.log(''); // Spacing

      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      errorMessage(error.message);
      throw error;
    }
  }

  return messageHistory;
}

// Test Cases
async function testMarketingAgreementStandard(openaiService) {
  testHeader('Marketing Agreement - Standard Terms');

  await simulateConversation(openaiService, [
    'marketing',
    'standard',
    'Date: 1st March 2026, Seller: George Papas, Property: 0/12345 Tala Paphos, Fee: 5%, Price: €350,000, Agent: Danae Pirou',
  ]);

  successMessage('Marketing agreement standard test completed');
}

async function testMarketingAgreementCustom(openaiService) {
  testHeader('Marketing Agreement - Custom Terms');

  await simulateConversation(openaiService, [
    'marketing',
    'custom',
    'Date: 15th April 2026, Seller: Maria Constantinou, Property: 0/6789 Limassol, Fee: 3%, Price: €500,000, Agent: Andreas Georgiou',
  ]);

  successMessage('Marketing agreement custom test completed');
}

async function testStandardViewingForm(openaiService) {
  testHeader('Standard Viewing Form');

  await simulateConversation(openaiService, [
    'viewing',
    'standard',
    'Date: 28/09/2024, Name: John Smith, ID: PA123456, Reg: 0/1567, District: Paphos, Municipality: Tala, Locality: Konia',
  ]);

  successMessage('Standard viewing form test completed');
}

async function testMultiplePersonsViewingForm(openaiService) {
  testHeader('Multiple Persons Viewing Form');

  await simulateConversation(openaiService, [
    'viewing',
    'couple',
    'Date: 8th September 2025, Person 1: David Cohen IL123456 Israel, Person 2: Rachel Cohen IL789012 Israel, District: Paphos, Municipality: Neo Chorio, Reg: 0/1567',
  ]);

  successMessage('Multiple persons viewing form test completed');
}

async function testStandardSellerRegistration(openaiService) {
  testHeader('Standard Seller Registration');

  await simulateConversation(openaiService, [
    'registration',
    'seller',
    'standard',
    'Buyer: John Smith, Property: Reg No. 0/1234 Tala Paphos, Link: https://zyprus.com/property/1234, Viewing: Saturday 14 October at 3pm',
  ]);

  successMessage('Standard seller registration test completed');
}

async function testBankRegistration(openaiService) {
  testHeader('Bank Registration');

  await simulateConversation(openaiService, [
    'registration',
    'banks',
    'property',
    'Client: remuproperties.com, Property: Reg No. 0/5678 Limassol, Link: https://zyprus.com/property/5678, Viewing: Monday 16 October at 10am, Mobile: 99076732',
  ]);

  successMessage('Bank registration test completed');
}

async function testTextRecognition(openaiService) {
  testHeader('Text Recognition (Numbers vs Text)');

  await simulateConversation(openaiService, [
    'registration',
    'seller', // Using text instead of "1"
    'standard', // Using text instead of "1"
    'Buyer: Jane Doe, Property: Reg No. 0/9999 Paphos, Link: https://zyprus.com/9999, Viewing: Friday 20 Oct at 2pm',
  ]);

  successMessage('Text recognition test completed');
}

async function testGreeting(openaiService) {
  testHeader('Greeting Response');

  await simulateConversation(openaiService, [
    'hello',
  ]);

  successMessage('Greeting test completed');
}

async function testCalculator(openaiService) {
  testHeader('Transfer Fees Calculator');

  await simulateConversation(openaiService, [
    'calculate transfer fees for €300,000',
  ]);

  successMessage('Calculator test completed');
}

// Main test runner
async function runAllTests() {
  console.log('\n');
  log(colors.bright + colors.magenta, '╔═══════════════════════════════════════════════════════════════╗');
  log(colors.bright + colors.magenta, '║         SOPHIA AI LOCAL TEST SUITE                           ║');
  log(colors.bright + colors.magenta, '╚═══════════════════════════════════════════════════════════════╝');

  // Check environment
  if (!process.env.OPENAI_API_KEY) {
    errorMessage('OPENAI_API_KEY not found in environment');
    errorMessage('Make sure .env.local exists in the root directory');
    process.exit(1);
  }

  infoMessage(`OpenAI API Key: ${process.env.OPENAI_API_KEY.substring(0, 10)}...`);

  try {
    const openaiService = new OpenAIService();
    infoMessage(`Model: ${openaiService.getConfig().model}`);
    infoMessage(`Temperature: ${openaiService.getConfig().temperature}`);
    infoMessage(`Max Tokens: ${openaiService.getConfig().maxTokens}`);

    // Run all tests
    const tests = [
      { name: 'Greeting', fn: testGreeting },
      { name: 'Standard Seller Registration', fn: testStandardSellerRegistration },
      { name: 'Bank Registration', fn: testBankRegistration },
      { name: 'Standard Viewing Form', fn: testStandardViewingForm },
      { name: 'Multiple Persons Viewing', fn: testMultiplePersonsViewingForm },
      { name: 'Marketing Agreement (Standard)', fn: testMarketingAgreementStandard },
      { name: 'Marketing Agreement (Custom)', fn: testMarketingAgreementCustom },
      { name: 'Text Recognition', fn: testTextRecognition },
      { name: 'Calculator', fn: testCalculator },
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        await test.fn(openaiService);
        passed++;
      } catch (error) {
        errorMessage(`Test failed: ${test.name}`);
        errorMessage(error.message);
        failed++;
      }
    }

    // Summary
    console.log('\n');
    separator();
    log(colors.bright + colors.magenta, '📊 TEST SUMMARY');
    separator();
    successMessage(`Passed: ${passed}/${tests.length}`);
    if (failed > 0) {
      errorMessage(`Failed: ${failed}/${tests.length}`);
    }
    console.log('');

    if (failed === 0) {
      successMessage('🎉 ALL TESTS PASSED!');
    } else {
      errorMessage('❌ SOME TESTS FAILED');
      process.exit(1);
    }

  } catch (error) {
    errorMessage('Fatal error running tests');
    console.error(error);
    process.exit(1);
  }
}

// Run specific test
async function runSpecificTest(testName) {
  if (!process.env.OPENAI_API_KEY) {
    errorMessage('OPENAI_API_KEY not found in environment');
    process.exit(1);
  }

  const openaiService = new OpenAIService();

  const tests = {
    greeting: testGreeting,
    registration: testStandardSellerRegistration,
    bank: testBankRegistration,
    viewing: testStandardViewingForm,
    'viewing-multiple': testMultiplePersonsViewingForm,
    'marketing-standard': testMarketingAgreementStandard,
    'marketing-custom': testMarketingAgreementCustom,
    'text-recognition': testTextRecognition,
    calculator: testCalculator,
  };

  const testFn = tests[testName];
  if (!testFn) {
    errorMessage(`Test not found: ${testName}`);
    console.log('\nAvailable tests:');
    Object.keys(tests).forEach(name => console.log(`  - ${name}`));
    process.exit(1);
  }

  try {
    await testFn(openaiService);
    successMessage(`✅ Test "${testName}" passed`);
  } catch (error) {
    errorMessage(`❌ Test "${testName}" failed`);
    console.error(error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length > 0 && args[0] !== 'all') {
  // Run specific test
  runSpecificTest(args[0]);
} else {
  // Run all tests
  runAllTests();
}
