import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";

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
 * Creates the AnalyzedReviews table for storing review analysis results
 */
async function createAnalyzedReviewsTable() {
  try {
    // Check if table already exists
    try {
      const describeResult = await dynamoClient.send(new DescribeTableCommand({
        TableName: "AnalyzedReviews"
      }));
      console.log("✅ AnalyzedReviews table already exists!");
      console.log("Table status:", describeResult.Table?.TableStatus);
      return;
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
        },
        {
          AttributeName: "restaurantId",
          AttributeType: "S"
        },
        {
          AttributeName: "reviewHash",
          AttributeType: "S"
        }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "RestaurantIndex",
          KeySchema: [
            {
              AttributeName: "restaurantId",
              KeyType: "HASH"
            }
          ],
          Projection: {
            ProjectionType: "ALL"
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        },
        {
          IndexName: "ReviewHashIndex",
          KeySchema: [
            {
              AttributeName: "reviewHash",
              KeyType: "HASH"
            }
          ],
          Projection: {
            ProjectionType: "ALL"
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10
      }
    });

    const result = await dynamoClient.send(createTableCommand);
    console.log("🎉 AnalyzedReviews table created successfully!");
    console.log("Table ARN:", result.TableDescription?.TableArn);
    
    // Wait for table to become active
    console.log("⏳ Waiting for table to become active...");
    let tableStatus = "CREATING";
    
    while (tableStatus !== "ACTIVE") {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const describeResult = await dynamoClient.send(new DescribeTableCommand({
        TableName: "AnalyzedReviews"
      }));
      tableStatus = describeResult.Table?.TableStatus || "UNKNOWN";
      console.log("Table status:", tableStatus);
    }
    
    console.log("✅ AnalyzedReviews table is now ACTIVE and ready to use!");
    
  } catch (error) {
    console.error("❌ Error creating AnalyzedReviews table:", error);
    throw error;
  }
}

// Run the script
createAnalyzedReviewsTable()
  .then(() => {
    console.log("🏁 Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });