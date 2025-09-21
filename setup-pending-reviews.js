/**
 * Utility script to mark reviews as pending for AI analysis
 * This helps test the Bedrock integration
 */

import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoClient } from "./src/lib/aws-config-compliant.js";

const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

async function markReviewsAsPending(count = 5) {
  try {
    console.log(`🔄 Marking ${count} reviews as pending for AI analysis...`);
    
    // Get some existing reviews
    const result = await dynamoDocClient.send(new ScanCommand({
      TableName: "Reviews",
      Limit: count
    }));
    
    if (!result.Items || result.Items.length === 0) {
      console.log("❌ No reviews found in database");
      return;
    }
    
    console.log(`Found ${result.Items.length} reviews to mark as pending`);
    
    // Mark them as pending
    for (const review of result.Items) {
      await dynamoDocClient.send(new UpdateCommand({
        TableName: "Reviews",
        Key: { reviewId: review.reviewId },
        UpdateExpression: "SET isFake = :pending",
        ExpressionAttributeValues: {
          ":pending": "pending"
        }
      }));
      
      console.log(`✅ Marked ${review.reviewId} as pending`);
    }
    
    console.log(`\n🎉 Successfully marked ${result.Items.length} reviews as pending`);
    console.log("Now you can run: node test-bedrock.js");
    
  } catch (error) {
    console.error("❌ Error marking reviews as pending:", error);
  }
}

// CLI usage
const count = parseInt(process.argv[2]) || 5;
markReviewsAsPending(count);
