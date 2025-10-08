#!/usr/bin/env node

/**
 * Test script to verify Sophia understands the 11 new document templates
 */

import { getOpenAIService } from './packages/services/src/openai.service.js';

async function testDocumentGeneration() {
  console.log('🧪 Testing Sophia with new 11 document templates...\n');

  const openaiService = getOpenAIService();

  const testCases = [
    {
      name: 'Registration Sub-Type Clarification Test',
      message: 'I need a registration',
      expectedResponse: 'Should ask: "Which registration do you need: 1) Seller(s), 2) Developer, or 3) Bank?"'
    },
    {
      name: 'Seller Registration Sub-Type Test',
      message: 'I need a seller registration',
      expectedResponse: 'Should ask: "Which seller registration do you need: (1) Standard Registration, (2) Registration and Marketing Agreement, (3) Very Advanced Registration, or (4) Rental Registration?"'
    },
    {
      name: 'Bank Registration Test',
      message: 'Bank registration for remuproperties.com, client Natasha Stainthorpe',
      expectedFields: ['bank_team', 'client_name_phone', 'property_link', 'agent_mobile']
    },
    {
      name: 'Standard Registration Test',
      message: 'I need a standard seller registration for Katerina Anastasiou, property 0/2456 Tala',
      expectedFields: ['client_name', 'property_introduced', 'viewing_datetime']
    }
  ];

  for (const testCase of testCases) {
    console.log(`📝 Testing: ${testCase.name}`);
    console.log(`📥 Input: "${testCase.message}"`);

    try {
      const response = await openaiService.generateResponse(testCase.message);

      console.log(`📤 Response length: ${response.text.length} characters`);
      console.log(`🔍 Contains required field checks: ${response.text.includes('need') || response.text.includes('missing') || response.text.includes('What')}`);
      console.log(`✅ Uses bold formatting: ${response.text.includes('**')}`);
      console.log('---');

    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
}

// Run the test
testDocumentGeneration().catch(console.error);