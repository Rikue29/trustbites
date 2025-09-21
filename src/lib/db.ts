import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoClient } from "./aws-config-compliant";

const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

export async function addReview(review: { 
  reviewId: string; 
  restaurantId: string; 
  reviewText: string; 
  isFake: boolean;
  sentiment?: string;
  language?: string;
  confidence?: number;
  rating?: number;
  authorName?: string;
  reviewDate?: string;
  reasons?: string[];
}) {
  await dynamoDocClient.send(new PutCommand({
    TableName: "Reviews",
    Item: review,
  }));
  return review;
}

export async function getReview(reviewId: string) {
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

// Business Owner Authentication Functions
export async function createBusinessOwner(owner: {
  ownerId: string;
  email: string;
  passwordHash: string;
  businessName: string;
  ownerName: string;
  restaurantIds?: string[];
}) {
  await dynamoDocClient.send(new PutCommand({
    TableName: "BusinessOwners",
    Item: {
      ...owner,
      createdAt: new Date().toISOString(),
      restaurantIds: owner.restaurantIds || [],
      isVerified: false,
      subscriptionStatus: 'free'
    },
  }));
  return owner;
}

export async function getBusinessOwnerByEmail(email: string) {
  const data = await dynamoDocClient.send(new ScanCommand({
    TableName: "BusinessOwners",
    FilterExpression: "email = :email",
    ExpressionAttributeValues: {
      ":email": email
    }
  }));
  return data.Items?.[0];
}

export async function getBusinessOwnerById(ownerId: string) {
  const data = await dynamoDocClient.send(new GetCommand({
    TableName: "BusinessOwners",
    Key: { ownerId },
  }));
  return data.Item;
}

export async function updateBusinessOwner(ownerId: string, updates: any) {
  const updateExpressions = [];
  const expressionAttributeValues: any = {};
  const expressionAttributeNames: any = {};

  for (const [key, value] of Object.entries(updates)) {
    updateExpressions.push(`#${key} = :${key}`);
    expressionAttributeValues[`:${key}`] = value;
    expressionAttributeNames[`#${key}`] = key;
  }

  await dynamoDocClient.send(new UpdateCommand({
    TableName: "BusinessOwners",
    Key: { ownerId },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: expressionAttributeNames
  }));
}
