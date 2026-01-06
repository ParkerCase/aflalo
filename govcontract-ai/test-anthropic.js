#!/usr/bin/env node

// Test script to verify Anthropic API functionality
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: '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',
});

async function testAnthropicAPI() {
  try {
    console.log('Testing Anthropic API...');
    
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Test message: Can you respond with a simple "API working correctly"?'
        }
      ]
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : 'No text response';
    console.log('✅ Anthropic API Response:', responseText);
    console.log('✅ API is working correctly!');
    
  } catch (error) {
    console.error('❌ Anthropic API Error:', error);
  }
}

testAnthropicAPI();
