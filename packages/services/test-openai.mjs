import { OpenAIService } from './src/openai.service.js';

console.log('Testing OpenAI service with new API key...\n');

try {
  const openaiService = new OpenAIService();
  console.log('✅ OpenAI service initialized');
  
  console.log('\nGenerating test response...');
  const response = await openaiService.generateResponse('Hello, can you help me?', {
    agentId: 'test-agent-123'
  });
  
  console.log('\n✅ AI Response generated successfully!');
  console.log('Response:', response.text);
  console.log('Tokens used:', response.tokensUsed.total);
  console.log('Cost:', `$${response.costEstimate.toFixed(6)}`);
  console.log('Response time:', `${response.responseTime}ms`);
} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error('Full error:', error);
}
