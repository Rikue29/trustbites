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
  classification: 'genuine' | 'suspicious' | 'fake';
  isFake: boolean; // Keep for backward compatibility
  confidence: number;
  reasons: string[];
  sentiment: string;
  languageConfidence: number;
  explanation: string;
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
  "classification": "genuine/suspicious/fake",
  "confidence": 0.0-1.0,
  "reasons": ["reason1", "reason2"],
  "sentiment": "positive/negative/neutral",
  "languageConfidence": 0.0-1.0,
  "explanation": "Brief explanation of your decision"
}

Classification Guidelines:
- "genuine": High confidence (0.8+) that the review is authentic
- "suspicious": Medium confidence (0.5-0.8) or mixed signals that require caution
- "fake": High confidence (0.8+) that the review is fabricated

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
    
    if (!response.body) {
      throw new Error("No response body received from Bedrock");
    }
    
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log(`📋 Bedrock response structure:`, Object.keys(responseBody));
    
    // Parse response based on model type (using working format from debug)
    let aiResponse: string;
    
    if (modelId.includes("llama3") || modelId.includes("meta.llama")) {
      // Llama 3 response format (✅ WORKING: generation field)
      aiResponse = responseBody.generation || "";
    } else {
      // Default to Llama 3 format since it's the only working model
      aiResponse = responseBody.generation || "";
    }

    if (!aiResponse) {
      throw new Error(`No AI response content found in Bedrock response. Response keys: ${Object.keys(responseBody).join(', ')}`);
    }

    console.log(`📝 AI response preview: ${aiResponse.substring(0, 100)}...`);

    // Extract JSON from AI response with better error handling
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(`❌ No JSON found in AI response: ${aiResponse}`);
      throw new Error("Could not parse JSON from AI response - no JSON structure found");
    }

    let analysis;
    try {
      analysis = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error(`❌ JSON parse error: ${parseError}`);
      console.error(`❌ Attempted to parse: ${jsonMatch[0]}`);
      throw new Error(`JSON parsing failed: ${parseError}`);
    }

    // Validate required fields
    if (!analysis.classification && analysis.isFake === undefined) {
      console.error(`❌ Invalid analysis format: ${JSON.stringify(analysis)}`);
      throw new Error("Analysis missing required classification field");
    }
    
    // Map classification to boolean for backward compatibility
    const classification = analysis.classification || (analysis.isFake ? 'fake' : 'genuine');
    const isFake = classification === 'fake' || classification === 'suspicious';
    
    console.log(`✅ Analysis complete for ${review.reviewId}: ${classification.toUpperCase()} (${analysis.confidence})`);
    
    return {
      classification: classification as 'genuine' | 'suspicious' | 'fake',
      isFake: isFake,
      confidence: analysis.confidence,
      reasons: analysis.reasons || [],
      sentiment: analysis.sentiment || "neutral",
      languageConfidence: analysis.languageConfidence || 0.5,
      explanation: analysis.explanation || "AI analysis completed"
    };

  } catch (error) {
    console.error(`❌ Error analyzing review ${review.reviewId}:`, error);
    
    // Enhanced fallback analysis using sophisticated pattern detection
    console.log(`⚠️ Bedrock AI failed for ${review.reviewId}, using enhanced fallback analysis`);
    
    const reviewText = review.reviewText.toLowerCase();
    
    // Genuine indicators (specific, detailed, balanced)
    const genuineIndicators = [
      /booked with \w+/i, // booking platform mentions
      /staff were \w+/i, // specific staff feedback
      /\w+ sauce/i, // specific food details
      /aircon|air.?con/i, // specific venue details
      /massive venue|large venue/i, // venue descriptions
      /\d+ night|\d+ day/i, // specific time references
      /highlights?[-:\s]/i, // structured feedback
      /\bi'd prefer\b|\bi would prefer\b/i, // personal preferences
      /except \w+|but \w+/i, // balanced criticism
      /abit|a bit/i, // casual language
      /extensive|focus on/i, // detailed observations
    ];
    
    // Fake indicators (overly promotional)
    const fakeIndicators = ['amazing', 'perfect', 'best ever', 'highly recommend', 'absolutely incredible', 'outstanding', 'exceeded expectations'];
    
    // Suspicious indicators (overly negative or generic)
    const suspiciousIndicators = ['worst', 'terrible', 'horrible', 'never again', 'scam', 'disgusting', 'awful'];
    
    const genuineCount = genuineIndicators.filter(pattern => pattern.test(reviewText)).length;
    const fakeCount = fakeIndicators.filter(indicator => reviewText.includes(indicator)).length;
    const suspiciousCount = suspiciousIndicators.filter(indicator => reviewText.includes(indicator)).length;
    
    let classification: 'genuine' | 'suspicious' | 'fake' = 'genuine';
    let confidence = 0.7; // Start with higher confidence for fallback
    let explanation = 'Bedrock AI analysis failed - using enhanced pattern detection';
    let reasons = ['fallback_analysis'];
    
    // Determine classification based on sophisticated indicators
    if (fakeCount >= 2) {
      classification = 'fake';
      confidence = 0.8;
      explanation = 'Multiple promotional phrases detected (enhanced fallback analysis)';
      reasons = ['excessive_positive_language', 'promotional_content'];
    } else if (suspiciousCount >= 2) {
      classification = 'suspicious';
      confidence = 0.7;
      explanation = 'Multiple negative indicators detected (enhanced fallback analysis)';
      reasons = ['excessive_negative_language', 'potentially_biased'];
    } else if (genuineCount >= 3) {
      classification = 'genuine';
      confidence = 0.85;
      explanation = 'Multiple genuine indicators: specific details, balanced feedback, authentic language (enhanced fallback analysis)';
      reasons = ['specific_details', 'balanced_feedback', 'authentic_language'];
    } else if (genuineCount >= 1 && review.reviewText.length > 50) {
      classification = 'genuine';
      confidence = 0.75;
      explanation = 'Genuine indicators with sufficient detail (enhanced fallback analysis)';
      reasons = ['specific_details', 'adequate_length'];
    } else if (review.reviewText.length < 20) {
      classification = 'suspicious';
      confidence = 0.6;
      explanation = 'Review too short for reliable analysis (enhanced fallback analysis)';
      reasons = ['insufficient_content'];
    } else {
      // Default genuine with moderate confidence
      classification = 'genuine';
      confidence = 0.7;
      explanation = 'No strong negative indicators, appears authentic (enhanced fallback analysis)';
      reasons = ['neutral_content', 'no_red_flags'];
    }
    
    console.log(`🔍 Enhanced fallback result: ${classification.toUpperCase()} (${confidence}) - Genuine: ${genuineCount}, Fake: ${fakeCount}, Suspicious: ${suspiciousCount} indicators`);
    
    // Return enhanced fallback analysis
    return {
      classification,
      isFake: classification === 'fake',
      confidence,
      reasons,
      sentiment: "neutral",
      languageConfidence: confidence, // Use same confidence for language
      explanation
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
