import * as dotenv from "dotenv";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoClient } from "./lib/aws-config.js";

// Load environment variables
dotenv.config({ path: '.env.local' });

const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

// Data contract interfaces for AI integration
interface ReviewForAI {
  reviewId: string;
  reviewText: string;
  rating: number;
  language: string;
  authorName: string;
  reviewDate: string;
  restaurantId: string;
}

interface AIAnalysisResult {
  reviewId: string;
  isFake: boolean;
  confidence: number;
  reasons: string[];
  aiModel: string;
  aiVersion: string;
}

// Mock AI function (replace with your friend's actual model)
async function callFakeReviewDetectionAI(review: ReviewForAI): Promise<AIAnalysisResult> {
  // TODO: Replace this with your friend's actual AI model call
  // This is just a template showing the expected interface
  
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Mock AI logic (replace with real model)
  const suspiciousPatterns = [
    'amazing', 'perfect', 'best ever', 'highly recommend',
    'sangat bagus', 'terbaik', 'recommended'
  ];
  
  const text = review.reviewText.toLowerCase();
  const suspiciousWords = suspiciousPatterns.filter(pattern => text.includes(pattern));
  const isFake = suspiciousWords.length > 2 && review.rating === 5;
  
  return {
    reviewId: review.reviewId,
    isFake: isFake,
    confidence: isFake ? 0.7 + Math.random() * 0.3 : 0.2 + Math.random() * 0.5,
    reasons: isFake ? [`Contains ${suspiciousWords.length} suspicious patterns`, 'Perfect 5-star rating'] : ['Natural language patterns'],
    aiModel: 'trustbites-fake-detector',
    aiVersion: '1.0'
  };
}

export async function getPendingReviews(): Promise<ReviewForAI[]> {
  /*Get all reviews that need AI analysis*/
  try {
    const result = await dynamoDocClient.send(new ScanCommand({
      TableName: "Reviews",
      FilterExpression: "isFake = :pending",
      ExpressionAttributeValues: {
        ":pending": "pending"
      }
    }));

    return (result.Items || []).map(item => ({
      reviewId: item.reviewId,
      reviewText: item.reviewText,
      rating: item.rating,
      language: item.language || 'en',
      authorName: item.authorName,
      reviewDate: item.reviewDate,
      restaurantId: item.restaurantId
    }));
  } catch (error) {
    console.error("Error getting pending reviews:", error);
    return [];
  }
}

export async function updateReviewWithAI(analysisResult: AIAnalysisResult): Promise<boolean> {
  /*Update review with AI analysis results*/
  try {
    await dynamoDocClient.send(new UpdateCommand({
      TableName: "Reviews",
      Key: { reviewId: analysisResult.reviewId },
      UpdateExpression: `
        SET isFake = :isFake, 
            confidence = :confidence,
            aiModel = :aiModel,
            aiVersion = :aiVersion,
            aiAnalysisDate = :analysisDate,
            detectionReasons = :reasons
      `,
      ExpressionAttributeValues: {
        ":isFake": analysisResult.isFake ? "true" : "false",
        ":confidence": analysisResult.confidence,
        ":aiModel": analysisResult.aiModel,
        ":aiVersion": analysisResult.aiVersion,
        ":analysisDate": new Date().toISOString(),
        ":reasons": analysisResult.reasons
      }
    }));

    console.log(`✅ Updated review ${analysisResult.reviewId}: ${analysisResult.isFake ? 'FAKE' : 'GENUINE'} (${analysisResult.confidence.toFixed(2)})`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating review ${analysisResult.reviewId}:`, error);
    return false;
  }
}

export async function processReviewsWithAI(): Promise<{ processed: number; updated: number; errors: number }> {
  /*Main function to process pending reviews with AI*/
  console.log('🤖 Starting AI analysis of pending reviews...\n');
  
  let processed = 0;
  let updated = 0;
  let errors = 0;

  try {
    // Step 1: Get pending reviews
    const pendingReviews = await getPendingReviews();
    console.log(`📝 Found ${pendingReviews.length} reviews pending AI analysis`);

    if (pendingReviews.length === 0) {
      console.log('✅ No pending reviews found');
      return { processed: 0, updated: 0, errors: 0 };
    }

    // Step 2: Process each review
    for (const review of pendingReviews) {
      try {
        console.log(`\n🔍 Analyzing: ${review.authorName} - "${review.reviewText.substring(0, 50)}..."`);
        
        // Step 3: Call AI model (replace with your friend's function)
        const aiResult = await callFakeReviewDetectionAI(review);
        processed++;

        // Step 4: Update database
        const updateSuccess = await updateReviewWithAI(aiResult);
        if (updateSuccess) {
          updated++;
        }

        // Step 5: Log result
        const fakeStatus = aiResult.isFake ? '🚨 FAKE' : '✅ GENUINE';
        const confidence = `${(aiResult.confidence * 100).toFixed(1)}%`;
        console.log(`   Result: ${fakeStatus} (${confidence} confidence)`);
        if (aiResult.reasons.length > 0) {
          console.log(`   Reasons: ${aiResult.reasons.join(', ')}`);
        }

      } catch (error) {
        console.error(`❌ Error processing review ${review.reviewId}:`, error);
        errors++;
      }
    }

    // Step 6: Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 AI Analysis Complete!');
    console.log(`📊 Processed: ${processed} reviews`);
    console.log(`✅ Updated: ${updated} reviews`);
    console.log(`❌ Errors: ${errors} reviews`);
    console.log(`🤖 AI Model: ${pendingReviews.length > 0 ? 'trustbites-fake-detector v1.0' : 'N/A'}`);

    return { processed, updated, errors };

  } catch (error) {
    console.error('❌ Fatal error in AI processing:', error);
    return { processed, updated, errors: errors + 1 };
  }
}

// Export sample data for your friend's AI model testing
export async function exportSampleDataForAI(): Promise<void> {
  /*Export sample reviews for AI model testing*/
  try {
    const reviews = await getPendingReviews();
    const sampleData = reviews.slice(0, 10); // First 10 reviews
    
    console.log('📁 Sample data for AI model:');
    console.log('🔍 Pending reviews needing analysis:');
    sampleData.forEach((review, index) => {
      console.log(`\n${index + 1}. ${review.authorName} (${review.language})`);
      console.log(`   Rating: ${review.rating}⭐`);
      console.log(`   Text: "${review.reviewText.substring(0, 100)}..."`);
    });
    
    console.log('\n📋 Integration checklist for your AI teammate:');
    console.log('✅ Input format: ReviewForAI interface');
    console.log('✅ Output format: AIAnalysisResult interface');
    console.log('✅ Language support: English (en) + Bahasa Melayu (ms)');
    console.log('✅ Confidence range: 0.0 to 1.0');
    console.log('✅ See AI_INTEGRATION_GUIDE.md for full details');
    
  } catch (error) {
    console.error('❌ Error exporting sample data:', error);
  }
}

// Test the integration - run when called directly
async function runIntegrationTest() {
  console.log('🧪 Testing AI Integration System...\n');
  
  try {
    await exportSampleDataForAI();
    const result = await processReviewsWithAI();
    
    console.log('\n🏁 Integration test completed');
    console.log('🎯 Next steps:');
    console.log('   1. Share AI_INTEGRATION_GUIDE.md with your AI teammate');
    console.log('   2. Replace callFakeReviewDetectionAI() with their real model');
    console.log('   3. Test with real data before hackathon demo');
  } catch (error) {
    console.error('💥 Integration test failed:', error);
  }
}

// Auto-run test
runIntegrationTest();