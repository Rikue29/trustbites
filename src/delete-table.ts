import * as dotenv from "dotenv";
import { DynamoDBClient, DeleteTableCommand } from "@aws-sdk/client-dynamodb";

// Load environment variables
dotenv.config({ path: '.env.local' });

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function deleteReviewsTable() {
  try {
    const command = new DeleteTableCommand({
      TableName: "Reviews"
    });

    const result = await client.send(command);
    console.log("Table deletion initiated:", result.TableDescription?.TableName);
    console.log("Table status:", result.TableDescription?.TableStatus);
    console.log("Wait a few seconds for the table to be fully deleted.");
  } catch (error: any) {
    if (error.name === "ResourceNotFoundException") {
      console.log("Table 'Reviews' doesn't exist!");
    } else {
      console.error("Error deleting table:", error);
    }
  }
}

console.log("⚠️  WARNING: This will delete the 'Reviews' table and all its data!");
console.log("Only run this if you want to start fresh.");
deleteReviewsTable();