import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoClient } from "./aws-config-compliant";
import { createHash } from "crypto";

const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

// Test function to verify database connectivity
export async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    // Simple test - try to scan the AnalyzedReviews table
    const result = await dynamoDocClient.send(new ScanCommand({
      TableName: "AnalyzedReviews",
      Limit: 1
    }));
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

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

// === ANALYZED REVIEWS FUNCTIONS ===

/**
 * Generate a hash for a review to detect duplicates
 */
export function generateReviewHash(reviewText: string, rating: number, authorName: string): string {
  const content = `${reviewText.trim().toLowerCase()}|${rating}|${authorName.toLowerCase()}`;
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Save an analyzed review to the AnalyzedReviews table
 */
export async function saveAnalyzedReview(analysis: {
  restaurantId: string;
  reviewId: string;
  reviewText: string;
  authorName: string;
  rating: number;
  reviewDate: string;
  classification: 'genuine' | 'suspicious' | 'fake';
  isFake: boolean;
  confidence: number;
  sentiment: string;
  reasons: string[];
  explanation: string;
  languageConfidence: number;
  aiModel?: string;
  aiVersion?: string;
}) {
  const reviewHash = generateReviewHash(analysis.reviewText, analysis.rating, analysis.authorName);
  const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const item = {
    analysisId,
    restaurantId: analysis.restaurantId,
    reviewHash,
    reviewId: analysis.reviewId,
    reviewText: analysis.reviewText,
    authorName: analysis.authorName,
    rating: analysis.rating,
    reviewDate: analysis.reviewDate,
    analyzedAt: new Date().toISOString(),
    
    // AI Analysis Results
    classification: analysis.classification,
    isFake: analysis.isFake,
    confidence: analysis.confidence,
    sentiment: analysis.sentiment,
    reasons: analysis.reasons,
    explanation: analysis.explanation,
    languageConfidence: analysis.languageConfidence,
    aiModel: analysis.aiModel || 'bedrock-llama3-70b',
    aiVersion: analysis.aiVersion || '1.0'
  };

  console.log(`💾 Attempting to save item to AnalyzedReviews table:`, {
    analysisId,
    restaurantId: analysis.restaurantId,
    authorName: analysis.authorName,
    classification: analysis.classification,
    region: process.env.AWS_REGION
  });

  try {
    await dynamoDocClient.send(new PutCommand({
      TableName: "AnalyzedReviews",
      Item: item,
    }));
    
    console.log(`✅ Successfully saved analysis to AnalyzedReviews table for review hash: ${reviewHash.substring(0, 8)}... by ${analysis.authorName}`);
    return item;
  } catch (error) {
    console.error(`❌ Error saving to AnalyzedReviews table:`, error);
    console.error(`❌ Error details:`, {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      region: process.env.AWS_REGION,
      tableName: "AnalyzedReviews"
    });
    
    // If table doesn't exist, try to create it automatically
    if (error instanceof Error && error.message.includes('ResourceNotFoundException')) {
      console.log(`🔧 AnalyzedReviews table not found, trying to create it...`);
      // For now, just throw the error - we'll fix the table creation separately
      throw new Error(`AnalyzedReviews table does not exist. Please run the table creation script first.`);
    }
    
    throw error;
  }
}

/**
 * Check if a review has already been analyzed (by hash)
 */
export async function getExistingAnalysis(restaurantId: string, reviewText: string, rating: number, authorName: string) {
  const reviewHash = generateReviewHash(reviewText, rating, authorName);
  
  try {
    const data = await dynamoDocClient.send(new QueryCommand({
      TableName: "AnalyzedReviews",
      IndexName: "ReviewHashIndex",
      KeyConditionExpression: "reviewHash = :reviewHash",
      FilterExpression: "restaurantId = :restaurantId",
      ExpressionAttributeValues: {
        ":reviewHash": reviewHash,
        ":restaurantId": restaurantId
      }
    }));
    
    return data.Items?.[0] || null;
  } catch (error) {
    console.error("Error checking for existing analysis:", error);
    return null;
  }
}

/**
 * Get all analyzed reviews for a restaurant
 */
export async function getRestaurantAnalyses(restaurantId: string) {
  try {
    const data = await dynamoDocClient.send(new QueryCommand({
      TableName: "AnalyzedReviews",
      IndexName: "RestaurantIndex",
      KeyConditionExpression: "restaurantId = :restaurantId",
      ExpressionAttributeValues: {
        ":restaurantId": restaurantId
      }
    }));
    
    return data.Items || [];
  } catch (error) {
    console.error("Error getting restaurant analyses:", error);
    return [];
  }
}

/**
 * Get analysis statistics for a restaurant
 */
export async function getRestaurantAnalysisStats(restaurantId: string) {
  const analyses = await getRestaurantAnalyses(restaurantId);
  
  if (analyses.length === 0) {
    return null;
  }
  
  const genuine = analyses.filter(a => a.classification === 'genuine').length;
  const suspicious = analyses.filter(a => a.classification === 'suspicious').length;
  const fake = analyses.filter(a => a.classification === 'fake').length;
  const total = analyses.length;
  
  const trustScore = Math.round(((genuine * 1.0 + suspicious * 0.5) / total) * 100);
  
  return {
    total,
    distribution: {
      genuine: Math.round((genuine / total) * 100),
      suspicious: Math.round((suspicious / total) * 100),
      fake: Math.round((fake / total) * 100)
    },
    trustScore,
    lastAnalyzed: analyses.sort((a, b) => 
      new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime()
    )[0]?.analyzedAt
  };
}
