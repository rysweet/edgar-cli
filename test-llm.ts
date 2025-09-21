#!/usr/bin/env ts-node

import { ConfigManager } from './src/config/config-manager';
import { LLMClient } from './src/llm/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testLLMClient() {
  console.log('Testing LLM Client with environment configuration...\n');
  
  try {
    // Create config manager
    const config = new ConfigManager();
    console.log('Configuration loaded from:', config.getConfigPaths().configDirName);
    
    // Create LLM client
    const client = new LLMClient(config);
    
    // Get provider info
    const providerInfo = client.getProviderInfo();
    console.log('\nProvider Information:');
    console.log('- Provider:', providerInfo.provider);
    console.log('- Model:', providerInfo.model);
    console.log('- Config Source:', providerInfo.configSource);
    console.log('- Max Tokens:', providerInfo.maxTokens);
    console.log('- Temperature:', providerInfo.temperature);
    
    // Test with a simple prompt
    console.log('\nSending test message to LLM...');
    const response = await client.prompt('Hello! Can you tell me what 2 + 2 equals?');
    
    console.log('\nLLM Response:');
    console.log(response);
    
    // Test with system prompt
    console.log('\n---\n\nTesting with system prompt...');
    const response2 = await client.prompt(
      'What is the capital of France?',
      'You are a helpful assistant. Answer concisely.'
    );
    
    console.log('\nLLM Response:');
    console.log(response2);
    
    console.log('\n✓ LLM Client test completed successfully!');
  } catch (error) {
    console.error('\n✗ Test failed with error:');
    console.error(error instanceof Error ? error.message : error);
    
    if (error instanceof Error && error.message.includes('API key')) {
      console.log('\nHint: Make sure your API key is properly configured in:');
      console.log('  - .env file (LLM_PROVIDER and corresponding API key)');
      console.log('  - or ~/.edgar/settings.json');
      console.log('  - or ./.edgar/settings.local.json');
    }
    
    process.exit(1);
  }
}

// Run the test
testLLMClient();