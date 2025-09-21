import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { DynamoDBClient, CreateTableCommand, DescribeTableCommand, DeleteTableCommand } from "@aws-sdk/client-dynamodb";

console.log(`🔐 AWS Region: ${process.env.AWS_REGION}`);
console.log(`🔐 AWS Access Key ID starts with: ${process.env.AWS_ACCESS_KEY_ID?.substring(0, 8)}...`);

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Creates a simple AnalyzedReviews table without Global Secondary Indexes
 */
async function createSimpleAnalyzedReviewsTable() {
  try {
    // Check if table already exists
    try {
      const describeResult = await dynamoClient.send(new DescribeTableCommand({
        TableName: "AnalyzedReviews"
      }));
      console.log("⚠️ AnalyzedReviews table already exists!");
      console.log("Table status:", describeResult.Table?.TableStatus);
      
      // Delete the existing table if it's problematic
      console.log("🗑️ Deleting existing table to recreate it properly...");
      await dynamoClient.send(new DeleteTableCommand({
        TableName: "AnalyzedReviews"
      }));
      
      console.log("⏳ Waiting for table deletion...");
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
    } catch (error) {
      // Table doesn't exist, continue to create it
      console.log("📋 AnalyzedReviews table doesn't exist, creating...");
    }

    const createTableCommand = new CreateTableCommand({
      TableName: "AnalyzedReviews",
      KeySchema: [
        {
          AttributeName: "analysisId",
          KeyType: "HASH" // Primary key
        }
      ],
      AttributeDefinitions: [
        {
          AttributeName: "analysisId",
          AttributeType: "S"
        }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    });

    const result = await dynamoClient.send(createTableCommand);
    console.log("🎉 AnalyzedReviews table created successfully!");
    console.log("Table ARN:", result.TableDescription?.TableArn);
    
    // Wait for table to become active
    console.log("⏳ Waiting for table to become active...");
    let tableStatus = "CREATING";
    
    while (tableStatus !== "ACTIVE") {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const describeResult = await dynamoClient.send(new DescribeTableCommand({
        TableName: "AnalyzedReviews"
      }));
      tableStatus = describeResult.Table?.TableStatus || "UNKNOWN";
      console.log("Table status:", tableStatus);
    }
    
    console.log("✅ AnalyzedReviews table is now ACTIVE and ready to use!");
    console.log("🏗️ Simple table structure (no indexes needed for basic saving)");
    
  } catch (error) {
    console.error("❌ Error creating AnalyzedReviews table:", error);
    throw error;
  }
}

// Run the script
createSimpleAnalyzedReviewsTable()
  .then(() => {
    console.log("🏁 Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });