import { OpenAIService } from './packages/services/src/openai.service';

async function test() {
  console.log('Testing OpenAI Service locally...');
  console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
  console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0);

  try {
    console.log('\n1. Creating OpenAIService instance...');
    const service = new OpenAIService();
    console.log('✓ OpenAIService created successfully');

    console.log('\n2. Generating response for "Hi"...');
    const response = await service.generateResponse('Hi', { agentId: 'test' });
    console.log('✓ Response generated:', response.text);
    console.log('  Tokens used:', response.tokensUsed.total);
    console.log('  Cost:', response.costEstimate);
    console.log('  Response time:', response.responseTime, 'ms');
  } catch (error) {
    console.error('\n✗ Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

test();
