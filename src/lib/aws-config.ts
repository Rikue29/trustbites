// aws-config.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { LambdaClient } from "@aws-sdk/client-lambda";
import { ComprehendClient } from "@aws-sdk/client-comprehend"; 

// You don't need to hardcode creds if `aws configure` is done!
// SDK will auto-read from ~/.aws/credentials and ~/.aws/config

const region = process.env.AWS_REGION || "ap-southeast-1"; // fallback

// Check if credentials are available
const credentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY 
  ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
  : undefined;

console.log('AWS Config - Region:', region);
console.log('AWS Config - Credentials available:', !!credentials);

// DynamoDB client
export const dynamoClient = new DynamoDBClient({ 
  region: region,
  ...(credentials && { credentials }),
});

// Lambda client
export const lambdaClient = new LambdaClient({ 
  region: region,
  ...(credentials && { credentials }),
});

// Comprehend client (for NLP: sentiment, language detection, etc.)
export const comprehendClient = new ComprehendClient({ 
  region: "ap-southeast-1", 
  ...(credentials && { credentials }),
});