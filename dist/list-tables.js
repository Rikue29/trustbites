import * as dotenv from "dotenv";
import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";
// Load environment variables
dotenv.config({ path: '.env.local' });
const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "ap-southeast-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
async function listTables() {
    try {
        const command = new ListTablesCommand({});
        const result = await client.send(command);
        console.log("Your DynamoDB tables:");
        if (result.TableNames && result.TableNames.length > 0) {
            result.TableNames.forEach((tableName, index) => {
                console.log(`${index + 1}. ${tableName}`);
            });
        }
        else {
            console.log("No tables found.");
        }
    }
    catch (error) {
        console.error("Error listing tables:", error);
    }
}
listTables();
