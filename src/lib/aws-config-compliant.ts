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
  accessKeyId: process.env.TRUSTBITES_ACCESS_KEY_ID!,
  secretAccessKey: process.env.TRUSTBITES_SECRET_ACCESS_KEY!,
};

// Primary services in Malaysia
export const s3Client = new S3Client({
  region: MALAYSIA_REGION,
  credentials,
});

// DynamoDB - Use the region from environment variable where table was created
export const dynamoClient = new DynamoDBClient({
  region: process.env.TRUSTBITES_AWS_REGION || SINGAPORE_REGION, // Use env region (ap-southeast-1)
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