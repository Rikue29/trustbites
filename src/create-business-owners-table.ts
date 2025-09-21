import * as dotenv from "dotenv";
import { CreateTableCommand } from "@aws-sdk/client-dynamodb";
import { dynamoClient } from "./lib/aws-config-compliant";

// Load environment variables
dotenv.config({ path: '.env.local' });

async function createBusinessOwnersTable() {
  try {
    console.log("Creating BusinessOwners table...");
    
    await dynamoClient.send(new CreateTableCommand({
      TableName: "BusinessOwners",
      KeySchema: [
        { AttributeName: "ownerId", KeyType: "HASH" } // Partition key
      ],
      AttributeDefinitions: [
        { AttributeName: "ownerId", AttributeType: "S" },
        { AttributeName: "email", AttributeType: "S" },
        { AttributeName: "restaurantId", AttributeType: "S" }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "EmailIndex",
          KeySchema: [
            { AttributeName: "email", KeyType: "HASH" }
          ],
          Projection: { ProjectionType: "ALL" }
        },
        {
          IndexName: "RestaurantOwnerIndex",
          KeySchema: [
            { AttributeName: "restaurantId", KeyType: "HASH" }
          ],
          Projection: { ProjectionType: "ALL" }
        }
      ],
      BillingMode: "PAY_PER_REQUEST"
    }));

    console.log("✅ BusinessOwners table created successfully!");
    console.log("Wait a few seconds for table to become active...");

  } catch (error: any) {
    if (error.name === "ResourceInUseException") {
      console.log("⚠️ BusinessOwners table already exists");
    } else {
      console.error("❌ Error creating BusinessOwners table:", error);
    }
  }
}

createBusinessOwnersTable();