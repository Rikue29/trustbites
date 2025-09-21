#!/usr/bin/env node

/**
 * Simple test for DeepSeek-R1 and Llama 3 70B Bedrock integration
 */

console.log('🚀 Testing AWS Bedrock with Your Available Models');
console.log('================================================');
console.log('Available models:');
console.log('  • DeepSeek-R1 (deepseek.deepseek-r1-distill-llama-70b-v1:0)');
console.log('  • Llama 3 70B Instruct (meta.llama3-70b-instruct-v1:0)');
console.log('');

// Test with sample review data
const sampleReview = {
  reviewId: "test-review-001",
  reviewText: "This restaurant is absolutely amazing! Best food ever! 5 stars definitely!!!",
  rating: 5,
  language: "en",
  authorName: "TestUser"
};

console.log('📝 Sample Review to Test:');
console.log(`   Text: "${sampleReview.reviewText}"`);
console.log(`   Rating: ${sampleReview.rating}/5`);
console.log('');

console.log('🧪 Testing via API endpoints:');
console.log('');

// Test 1: DeepSeek-R1
console.log('1️⃣ Testing DeepSeek-R1 model:');
console.log('   curl -X POST http://localhost:3000/api/ai/bedrock \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -d \'{"action": "analyze-single", "reviewId": "rev_fd196bc1eed1", "modelId": "deepseek.deepseek-r1-distill-llama-70b-v1:0"}\'');
console.log('');

// Test 2: Llama 3 70B
console.log('2️⃣ Testing Llama 3 70B Instruct model:');
console.log('   curl -X POST http://localhost:3000/api/ai/bedrock \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -d \'{"action": "analyze-single", "reviewId": "rev_fd196bc1eed1", "modelId": "meta.llama3-70b-instruct-v1:0"}\'');
console.log('');

// Test 3: Process pending reviews
console.log('3️⃣ Process all pending reviews (default DeepSeek-R1):');
console.log('   curl -X POST http://localhost:3000/api/ai/bedrock \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -d \'{"action": "analyze-pending"}\'');
console.log('');

console.log('✅ Your AWS credentials are already configured in .env.local');
console.log('✅ No separate Bedrock API key needed - uses your AWS credentials');
console.log('');
console.log('⚠️  Important Notes:');
console.log('   • Make sure your AWS user has bedrock:InvokeModel permissions');
console.log('   • Bedrock models must be enabled in AWS Console');
console.log('   • Test with us-east-1 region first (most models available there)');
console.log('');
console.log('🔧 If you get errors, check:');
console.log('   1. AWS Console > Bedrock > Model access');
console.log('   2. Your AWS IAM permissions');
console.log('   3. Region availability (try BEDROCK_REGION=us-east-1 in .env.local)');

export {};
