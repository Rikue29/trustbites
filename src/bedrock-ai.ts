import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoClient } from "./lib/aws-config-compliant";
import { updateReviewWithAIAnalysis, getPendingReviews } from "./ai-integration";

const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

// Initialize Bedrock client
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.BEDROCK_REGION || process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Available Bedrock models for fake review detection (your accessible models)
export const BEDROCK_MODELS = {
  LLAMA3_70B_INSTRUCT: "meta.llama3-70b-instruct-v1:0",  // ✅ Working model
  // DeepSeek not available in your account, keeping Llama as primary
} as const;

export interface ReviewForAnalysis {
  reviewId: string;
  reviewText: string;
  rating: number;
  language: string;
  authorName: string;
  reviewDate: string;
  restaurantName?: string;
}

export interface FakeReviewAnalysis {
  isFake: boolean;
  confidence: number;
  reasons: string[];
  sentiment: string;
  languageConfidence: number;
}

/**
 * Create a comprehensive prompt for fake review detection
 */
function createFakeReviewPrompt(review: ReviewForAnalysis): string {
  return `You are an expert at detecting fake restaurant reviews. Analyze the following review and determine if it's genuine or fake.

Review Details:
- Text: "${review.reviewText}"
- Rating: ${review.rating}/5 stars
- Language: ${review.language}
- Author: ${review.authorName}
- Date: ${review.reviewDate}
- Restaurant: ${review.restaurantName || "Unknown"}

Analyze for these fake review indicators:
1. **Generic Language**: Overly generic praise/complaints
2. **Excessive Emotion**: Unrealistic superlatives or extreme negativity
3. **Repetitive Patterns**: Similar phrasing to common fake reviews
4. **Inconsistent Details**: Contradictory information
5. **Timing Patterns**: Suspicious posting timing
6. **Language Quality**: Unnatural language flow
7. **Specificity**: Lack of specific details about food/service

Provide your analysis in this EXACT JSON format:
{
  "isFake": true/false,
  "confidence": 0.0-1.0,
  "reasons": ["reason1", "reason2"],
  "sentiment": "positive/negative/neutral",
  "languageConfidence": 0.0-1.0,
  "explanation": "Brief explanation of your decision"
}

Be thorough but concise. Consider cultural context for Malaysian/English reviews.`;
}

/**
 * Invoke Bedrock model for fake review detection
 */
export async function detectFakeReviewWithBedrock(
  review: ReviewForAnalysis,
  modelId: string = BEDROCK_MODELS.LLAMA3_70B_INSTRUCT
): Promise<FakeReviewAnalysis> {
  try {
    const prompt = createFakeReviewPrompt(review);
    
    // Prepare the request based on model type (using the working format from debug)
    let requestBody: any;
    
    if (modelId.includes("llama3")) {
      // Llama 3 format (✅ WORKING FORMAT from debug test)
      requestBody = {
        prompt: `<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\n${prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`,
        max_gen_len: 1000,
        temperature: 0.1,
        top_p: 0.9
      };
    } else {
      // Default to Llama 3 format since it's the only working model
      requestBody = {
        prompt: `<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\n${prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`,
        max_gen_len: 1000,
        temperature: 0.1,
        top_p: 0.9
      };
    }

    const command = new InvokeModelCommand({
      modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(requestBody),
    });

    console.log(`🤖 Analyzing review ${review.reviewId} with ${modelId}...`);
    
    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    // Parse response based on model type (using working format from debug)
    let aiResponse: string;
    
    if (modelId.includes("llama3") || modelId.includes("meta.llama")) {
      // Llama 3 response format (✅ WORKING: generation field)
      aiResponse = responseBody.generation || "";
    } else {
      // Default to Llama 3 format since it's the only working model
      aiResponse = responseBody.generation || "";
    }

    // Extract JSON from AI response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from AI response");
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    console.log(`✅ Analysis complete for ${review.reviewId}: ${analysis.isFake ? 'FAKE' : 'GENUINE'} (${analysis.confidence})`);
    
    return {
      isFake: analysis.isFake,
      confidence: analysis.confidence,
      reasons: analysis.reasons || [],
      sentiment: analysis.sentiment || "neutral",
      languageConfidence: analysis.languageConfidence || 0.5
    };

  } catch (error) {
    console.error(`❌ Error analyzing review ${review.reviewId}:`, error);
    
    // Return a fallback analysis
    return {
      isFake: false,
      confidence: 0.0,
      reasons: ["analysis_failed"],
      sentiment: "neutral",
      languageConfidence: 0.0
    };
  }
}

/**
 * Process all pending reviews with Bedrock AI
 */
export async function processPendingReviewsWithBedrock(
  modelId: string = BEDROCK_MODELS.LLAMA3_70B_INSTRUCT
): Promise<{ processed: number; errors: number }> {
  try {
    const pendingReviews = await getPendingReviews(dynamoDocClient);
    console.log(`🚀 Found ${pendingReviews.length} pending reviews for Bedrock analysis`);
    
    let processed = 0;
    let errors = 0;
    
    // Process reviews in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < pendingReviews.length; i += batchSize) {
      const batch = pendingReviews.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (review) => {
          try {
            const reviewForAnalysis: ReviewForAnalysis = {
              reviewId: review.reviewId,
              reviewText: review.reviewText,
              rating: review.rating,
              language: review.language || "en",
              authorName: review.authorName || "Anonymous",
              reviewDate: review.reviewDate,
              restaurantName: review.restaurant?.name
            };
            
            const analysis = await detectFakeReviewWithBedrock(reviewForAnalysis, modelId);
            
            await updateReviewWithAIAnalysis(dynamoDocClient, review.reviewId, {
              isFake: analysis.isFake,
              confidence: analysis.confidence,
              aiModel: `bedrock-${modelId}`,
              aiVersion: "1.0",
              detectionReasons: analysis.reasons
            });
            
            processed++;
          } catch (error) {
            console.error(`Error processing review ${review.reviewId}:`, error);
            errors++;
          }
        })
      );
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < pendingReviews.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`🎉 Bedrock analysis complete: ${processed} processed, ${errors} errors`);
    return { processed, errors };
    
  } catch (error) {
    console.error("Error in batch processing:", error);
    return { processed: 0, errors: 1 };
  }
}

/**
 * Analyze a single review with Bedrock (for real-time analysis)
 */
export async function analyzeSingleReview(
  reviewId: string,
  modelId: string = BEDROCK_MODELS.LLAMA3_70B_INSTRUCT
): Promise<FakeReviewAnalysis | null> {
  try {
    // Get review from database
    const result = await dynamoDocClient.send(new GetCommand({
      TableName: "Reviews",
      Key: { reviewId }
    }));
    
    if (!result.Item) {
      throw new Error(`Review ${reviewId} not found`);
    }
    
    const review = result.Item;
    const reviewForAnalysis: ReviewForAnalysis = {
      reviewId: review.reviewId,
      reviewText: review.reviewText,
      rating: review.rating,
      language: review.language || "en",
      authorName: review.authorName || "Anonymous",
      reviewDate: review.reviewDate,
      restaurantName: review.restaurant?.name
    };
    
    return await detectFakeReviewWithBedrock(reviewForAnalysis, modelId);
    
  } catch (error) {
    console.error(`Error analyzing single review ${reviewId}:`, error);
    return null;
  }
}

export default {
  detectFakeReviewWithBedrock,
  processPendingReviewsWithBedrock,
  analyzeSingleReview,
  BEDROCK_MODELS
};
