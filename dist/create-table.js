import * as dotenv from "dotenv";
import { DynamoDBClient, CreateTableCommand } from "@aws-sdk/client-dynamodb";
// Load environment variables
dotenv.config({ path: '.env.local' });
const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "ap-southeast-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
async function createReviewsTable() {
    try {
        const command = new CreateTableCommand({
            TableName: "Reviews",
            KeySchema: [
                {
                    AttributeName: "reviewId",
                    KeyType: "HASH" // Partition key
                }
            ],
            AttributeDefinitions: [
                {
                    AttributeName: "reviewId",
                    AttributeType: "S" // String
                }
            ],
            BillingMode: "PAY_PER_REQUEST" // On-demand billing
        });
        const result = await client.send(command);
        console.log("Table created successfully:", result.TableDescription?.TableName);
        console.log("Table status:", result.TableDescription?.TableStatus);
        console.log("Wait a few seconds for the table to become active before running test-dynamo.");
    }
    catch (error) {
        if (error.name === "ResourceInUseException") {
            console.log("Table 'Reviews' already exists!");
        }
        else {
            console.error("Error creating table:", error);
        }
    }
}
createReviewsTable();
