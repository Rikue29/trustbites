import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoClient } from "./aws-config.js";
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);
export async function addReview(review) {
    await dynamoDocClient.send(new PutCommand({
        TableName: "Reviews",
        Item: review,
    }));
    return review;
}
export async function getReview(reviewId) {
    const data = await dynamoDocClient.send(new GetCommand({
        TableName: "Reviews",
        Key: { reviewId },
    }));
    return data.Item;
}
export async function listReviews() {
    const data = await dynamoDocClient.send(new ScanCommand({
        TableName: "Reviews",
    }));
    return data.Items || [];
}
