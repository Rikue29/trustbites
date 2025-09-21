// Hackathon-compliant AWS configuration
// Primary: Malaysia (ap-southeast-5)
// Fallback: Singapore (ap-southeast-1) only for unavailable services

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { ComprehendClient } from '@aws-sdk/client-comprehend';
import { LambdaClient } from '@aws-sdk/client-lambda';

const MALAYSIA_REGION = 'ap-southeast-5';
const SINGAPORE_REGION = 'ap-southeast-1'; // Only for unavailable services

const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
};

// Primary services in Malaysia
export const s3Client = new S3Client({
  region: MALAYSIA_REGION,
  credentials,
});

// DynamoDB - HACKATHON PRIORITY: Malaysia region first!
export const dynamoClient = new DynamoDBClient({
  region: MALAYSIA_REGION, // HACKATHON: Malaysia region prioritized
  credentials,
});

// Comprehend - Not available in Malaysia, use Singapore
export const comprehendClient = new ComprehendClient({
  region: SINGAPORE_REGION, // Required fallback - Comprehend not in Malaysia
  credentials,
});

// Lambda client for Malaysia region
export const lambdaClient = new LambdaClient({
  region: MALAYSIA_REGION,
  credentials,
});