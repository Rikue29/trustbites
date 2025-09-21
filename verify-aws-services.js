#!/usr/bin/env node

import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { BedrockRuntimeClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock-runtime';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Verifying AWS Services for TrustBites AI...\n');

// Check required environment variables
const requiredEnvVars = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY', 
  'AWS_REGION',
  'GOOGLE_MAPS_API_KEY'
];

console.log('📋 Checking Environment Variables...');
let missingVars = [];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    missingVars.push(envVar);
    console.log(`❌ Missing: ${envVar}`);
  } else {
    console.log(`✅ Found: ${envVar}`);
  }
}

if (missingVars.length > 0) {
  console.log(`\n❌ Missing required environment variables: ${missingVars.join(', ')}`);
  console.log('Please set them in AWS Amplify Environment Variables section.');
  process.exit(1);
}

// Check DynamoDB connection and tables
console.log('\n🗄️  Checking DynamoDB Connection...');
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

try {
  const listTablesCommand = new ListTablesCommand({});
  const tablesResult = await dynamoClient.send(listTablesCommand);
  console.log('✅ DynamoDB connection successful');
  console.log(`📊 Found ${tablesResult.TableNames?.length || 0} tables in region ${process.env.AWS_REGION}`);
  
  // Check for required tables
  const requiredTables = ['AnalyzedReviews', 'TrustBites-Users', 'TrustBites-Restaurants'];
  const existingTables = tablesResult.TableNames || [];
  
  for (const table of requiredTables) {
    if (existingTables.includes(table)) {
      console.log(`✅ Table exists: ${table}`);
    } else {
      console.log(`⚠️  Table missing: ${table} (will be created automatically)`);
    }
  }
} catch (error) {
  console.log('❌ DynamoDB connection failed:', error.message);
  process.exit(1);
}

// Check Bedrock access
console.log('\n🤖 Checking AWS Bedrock Access...');
const bedrockClient = new BedrockRuntimeClient({
  region: 'us-east-1', // Bedrock models are in us-east-1
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

try {
  const modelsCommand = new ListFoundationModelsCommand({});
  const modelsResult = await bedrockClient.send(modelsCommand);
  console.log('✅ AWS Bedrock connection successful');
  
  // Check for Llama model
  const llamaModels = modelsResult.modelSummaries?.filter(model => 
    model.modelId?.includes('llama') || model.modelName?.toLowerCase().includes('llama')
  ) || [];
  
  if (llamaModels.length > 0) {
    console.log(`✅ Found ${llamaModels.length} Llama models available`);
  } else {
    console.log('⚠️  No Llama models found - check Bedrock model access');
  }
} catch (error) {
  console.log('❌ Bedrock connection failed:', error.message);
  console.log('Make sure you have Bedrock access in us-east-1 region');
  process.exit(1);
}

// Check Google Maps API (basic validation)
console.log('\n🗺️  Checking Google Maps API Key...');
if (process.env.GOOGLE_MAPS_API_KEY && process.env.GOOGLE_MAPS_API_KEY.length > 20) {
  console.log('✅ Google Maps API key format looks valid');
} else {
  console.log('⚠️  Google Maps API key missing or invalid format');
}

console.log('\n🎉 AWS Services verification completed!');
console.log('Your TrustBites AI app is ready for Amplify deployment.\n');

console.log('📝 Next steps:');
console.log('1. Push your code to GitHub');
console.log('2. Connect to AWS Amplify');
console.log('3. Set environment variables in Amplify console');
console.log('4. Deploy your application');

process.exit(0);