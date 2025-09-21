import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * Creates the AnalyzedReviews table for storing review analysis results
 * This table will cache AI analysis results to avoid re-analyzing the same reviews
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
      await new Promise(resolve => setTimeout(resolve, 2000));
      const describeResult = await dynamoClient.send(new DescribeTableCommand({
        TableName: "AnalyzedReviews"
      }));
      tableStatus = describeResult.Table?.TableStatus || "UNKNOWN";
      console.log("Table status:", tableStatus);
    }
    
    console.log("✅ AnalyzedReviews table is now ACTIVE and ready to use!");
    
  } catch (error) {
    console.error("❌ Error creating AnalyzedReviews table:", error);
  }
}

/**
 * Table Schema Documentation:
 * 
 * Primary Key: analysisId (String) - Unique identifier for each analysis
 * 
 * Fields stored:
 * - analysisId: Unique ID for this analysis record
 * - restaurantId: Google Places ID of the restaurant
 * - reviewHash: Hash of the review content (for duplicate detection)
 * - reviewId: Original review ID from Google Places (timestamp)
 * - reviewText: The actual review text
 * - authorName: Name of the review author
 * - rating: Review rating (1-5)
 * - reviewDate: When the review was originally posted
 * - analyzedAt: When this analysis was performed
 * 
 * AI Analysis Results:
 * - classification: 'genuine' | 'suspicious' | 'fake'
 * - isFake: boolean (for backward compatibility)
 * - confidence: number (0-100)
 * - sentiment: string ('POSITIVE', 'NEGATIVE', 'NEUTRAL')
 * - reasons: array of reasons for the classification
 * - explanation: detailed explanation of the analysis
 * - languageConfidence: confidence in language analysis
 * - aiModel: which AI model was used
 * - aiVersion: version of the analysis
 * 
 * Indexes:
 * - RestaurantIndex: Query all analyses for a specific restaurant
 * - ReviewHashIndex: Quick lookup to prevent duplicate analysis
 */

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

export { createAnalyzedReviewsTable };