import * as dotenv from "dotenv";
import { CreateTableCommand } from "@aws-sdk/client-dynamodb";
import { dynamoClient } from "./lib/aws-config-compliant";

// Load environment variables
dotenv.config({ path: '.env.local' });

async function createAnalysisTable() {
  try {
    console.log("Creating AnalysisResults table...");
    
    await dynamoClient.send(new CreateTableCommand({
      TableName: "AnalysisResults",
      KeySchema: [
        { AttributeName: "analysisId", KeyType: "HASH" } // Partition key
      ],
      AttributeDefinitions: [
        { AttributeName: "analysisId", AttributeType: "S" },
        { AttributeName: "restaurantId", AttributeType: "S" },
        { AttributeName: "analysisDate", AttributeType: "S" }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "RestaurantAnalysisIndex",
          KeySchema: [
            { AttributeName: "restaurantId", KeyType: "HASH" },
            { AttributeName: "analysisDate", KeyType: "RANGE" }
          ],
          Projection: { ProjectionType: "ALL" }
        }
      ],
      BillingMode: "PAY_PER_REQUEST"
    }));

    console.log("✅ AnalysisResults table created successfully!");
    console.log("Wait a few seconds for table to become active...");

  } catch (error: any) {
    if (error.name === "ResourceInUseException") {
      console.log("⚠️ AnalysisResults table already exists");
    } else {
      console.error("❌ Error creating AnalysisResults table:", error);
    }
  }
}

createAnalysisTable();