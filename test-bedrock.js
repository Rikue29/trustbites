#!/usr/bin/env node

/**
 * Test script for AWS Bedrock fake review detection
 * Run this to test your Bedrock AI integration
 */

import { processPendingReviewsWithBedrock, BEDROCK_MODELS } from './src/bedrock-ai.js';

async function testBedrockIntegration() {
  console.log('🚀 Testing AWS Bedrock Fake Review Detection');
  console.log('============================================');
  
  try {
    // Test with Claude 3 Haiku (fastest and cheapest)
    console.log('\n📊 Processing pending reviews with Claude 3 Haiku...');
    const result = await processPendingReviewsWithBedrock(BEDROCK_MODELS.CLAUDE_3_HAIKU);
    
    console.log('\n✅ Results:');
    console.log(`   • Processed: ${result.processed} reviews`);
    console.log(`   • Errors: ${result.errors} reviews`);
    
    if (result.processed > 0) {
      console.log('\n🎉 Bedrock integration is working!');
      console.log('Check your database for updated fake review flags.');
    } else {
      console.log('\n⚠️  No pending reviews found.');
      console.log('Make sure you have reviews with isFake = "pending" in your database.');
    }
    
  } catch (error) {
    console.error('\n❌ Error testing Bedrock integration:', error);
    
    if (error.message.includes('UnauthorizedOperation')) {
      console.log('\n🔧 Fix: Check your AWS credentials and Bedrock permissions');
    } else if (error.message.includes('ModelNotFoundError')) {
      console.log('\n🔧 Fix: Ensure Bedrock models are available in your region');
      console.log('Available models:', Object.values(BEDROCK_MODELS));
    }
  }
}

// Available CLI commands
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
AWS Bedrock Test Script

Usage:
  node test-bedrock.js              # Test with default model (Claude 3 Haiku)
  node test-bedrock.js --model=X    # Test with specific model

Available models:
  - claude-haiku    (fast, cheap)
  - claude-sonnet   (balanced)
  - titan           (Amazon model)
  - llama2          (Meta model)

Examples:
  node test-bedrock.js --model=claude-sonnet
  node test-bedrock.js --model=titan
  `);
  process.exit(0);
}

// Parse model argument
const modelArg = process.argv.find(arg => arg.startsWith('--model='));
let selectedModel = BEDROCK_MODELS.CLAUDE_3_HAIKU;

if (modelArg) {
  const modelName = modelArg.split('=')[1];
  switch (modelName) {
    case 'claude-sonnet':
      selectedModel = BEDROCK_MODELS.CLAUDE_3_SONNET;
      break;
    case 'titan':
      selectedModel = BEDROCK_MODELS.TITAN_TEXT;
      break;
    case 'llama2':
      selectedModel = BEDROCK_MODELS.LLAMA2_70B;
      break;
    default:
      console.log(`⚠️  Unknown model: ${modelName}, using Claude 3 Haiku`);
  }
}

// Run the test
testBedrockIntegration().catch(console.error);
