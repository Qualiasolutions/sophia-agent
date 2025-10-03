import OpenAI from 'openai';

const OPENAI_API_KEY = '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';

console.log('Testing new OpenAI API key...\n');

try {
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  
  console.log('Sending test request to OpenAI...');
  const startTime = Date.now();
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are Sophia, an AI assistant for Cyprus real estate agents.' },
      { role: 'user', content: 'Hello, can you help me?' }
    ],
    temperature: 0.7,
    max_tokens: 500,
  });
  
  const responseTime = Date.now() - startTime;
  
  console.log('\n✅ SUCCESS! OpenAI API key is working!');
  console.log('\nResponse:', completion.choices[0].message.content);
  console.log('\nTokens used:', completion.usage.total_tokens);
  console.log('Response time:', `${responseTime}ms`);
  
} catch (error) {
  console.error('\n❌ ERROR! OpenAI API key failed!');
  console.error('Error:', error.message);
  if (error.status) {
    console.error('Status:', error.status);
  }
}
