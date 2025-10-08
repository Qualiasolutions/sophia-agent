#!/usr/bin/env node

/**
 * Test script to verify typo handling for "registeration" vs "registration"
 */

import { getOpenAIService } from './packages/services/src/openai.service.js';

async function testTypoHandling() {
  console.log('🧪 Testing typo handling for "registeration"...\n');

  const openaiService = getOpenAIService();

  const testCases = [
    {
      name: 'Correct spelling test',
      message: 'I need a registration',
      expectedBehavior: 'Should detect as document request'
    },
    {
      name: 'Missing "s" typo test',
      message: 'I need a registeration',
      expectedBehavior: 'Should detect as document request (FIXED)'
    },
    {
      name: 'Missing "i" typo test',
      message: 'I need a registraton',
      expectedBehavior: 'Should detect as document request (FIXED)'
    }
  ];

  for (const testCase of testCases) {
    console.log(`📝 Testing: ${testCase.name}`);
    console.log(`📥 Input: "${testCase.message}"`);

    try {
      // Test OpenAI service detection
      const response = await openaiService.generateResponse(testCase.message);

      console.log(`✅ Response received: ${response.text.substring(0, 100)}...`);
      console.log(`🔍 Contains clarifications: ${response.text.includes('Which registration') || response.text.includes('Which seller')}`);
      console.log('---');

    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
}

// Run the test
testTypoHandling().catch(console.error);