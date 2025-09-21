/**
 * Debug script to test Bedrock connection and find correct model IDs
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
config({ path: '.env.local' });

import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.BEDROCK_REGION || process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const possibleModelIds = [
  // DeepSeek variations
  "deepseek.deepseek-r1",
  "deepseek.deepseek-r1-distill-llama-70b-v1:0",
  "deepseek-r1",
  
  // Llama 3 variations
  "meta.llama3-70b-instruct",
  "meta.llama3-70b-instruct-v1:0", 
  "llama3-70b-instruct",
  "meta.llama3-70b-chat-v1:0",
  
  // Other common formats
  "anthropic.claude-3-haiku-20240307-v1:0",  // Test if Claude is available
  "amazon.titan-text-express-v1"             // Test if Titan is available
];

async function testModelAccess() {
  console.log("🔍 Testing Bedrock Model Access");
  console.log("==============================");
  
  // Check environment variables
  console.log("📋 Environment Check:");
  console.log(`AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.substring(0, 8) + '...' : 'NOT SET'}`);
  console.log(`AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? process.env.AWS_SECRET_ACCESS_KEY.substring(0, 8) + '...' : 'NOT SET'}`);
  console.log(`AWS_REGION: ${process.env.AWS_REGION || 'NOT SET'}`);
  console.log(`BEDROCK_REGION: ${process.env.BEDROCK_REGION || 'NOT SET'}`);
  console.log(`Region being used: ${process.env.BEDROCK_REGION || process.env.AWS_REGION || "us-east-1"}`);
  console.log("");
  
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.log("❌ AWS credentials not found!");
    console.log("Make sure .env.local exists with AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY");
    return;
  }
  
  const simplePrompt = "Hello, respond with 'OK' if you can understand this.";
  
  for (const modelId of possibleModelIds) {
    try {
      console.log(`Testing: ${modelId}...`);
      
      // Try different request formats
      const requestFormats = [
        // Format 1: Simple prompt
        { prompt: simplePrompt, max_tokens: 10, temperature: 0.1 },
        
        // Format 2: Llama format with tags
        { 
          prompt: `<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\n${simplePrompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`,
          max_gen_len: 10,
          temperature: 0.1
        },
        
        // Format 3: Claude format
        {
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 10,
          messages: [{ role: "user", content: simplePrompt }],
          temperature: 0.1
        }
      ];
      
      for (let i = 0; i < requestFormats.length; i++) {
        try {
          const command = new InvokeModelCommand({
            modelId,
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify(requestFormats[i]),
          });
          
          const response = await bedrockClient.send(command);
          const responseBody = JSON.parse(new TextDecoder().decode(response.body));
          
          console.log(`  ✅ SUCCESS with format ${i + 1}!`);
          console.log(`     Model ID: ${modelId}`);
          console.log(`     Response format: ${Object.keys(responseBody).join(', ')}`);
          console.log(`     Request format: ${Object.keys(requestFormats[i]).join(', ')}`);
          console.log("");
          break; // Success, move to next model
          
        } catch (formatError) {
          if (i === requestFormats.length - 1) {
            console.log(`  ❌ All formats failed: ${formatError.message.split('\n')[0]}`);
          }
        }
      }
      
    } catch (error) {
      console.log(`  ❌ Model not accessible: ${error.message.split('\n')[0]}`);
    }
  }
  
  console.log("\n🎯 Next Steps:");
  console.log("1. Use the successful model IDs in your BEDROCK_MODELS");
  console.log("2. Use the working request format in your code");
  console.log("3. Make sure BEDROCK_REGION is set correctly in .env.local");
}

testModelAccess().catch(console.error);
