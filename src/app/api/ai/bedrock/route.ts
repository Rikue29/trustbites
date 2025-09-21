import { NextRequest, NextResponse } from 'next/server';
// import { processPendingReviewsWithBedrock, analyzeSingleReview, BEDROCK_MODELS } from '../../../../bedrock-ai';

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 Bedrock AI analysis API called');
    
    const body = await request.json();
    const { action, reviewId, modelId } = body;
    
    // Validate model ID
    const validModels = Object.values(BEDROCK_MODELS);
    const selectedModel = modelId && validModels.includes(modelId as any) ? modelId as any : BEDROCK_MODELS.LLAMA3_70B_INSTRUCT;
    
    if (action === 'analyze-single' && reviewId) {
      // Analyze a single review
      console.log(`Analyzing single review: ${reviewId} with model: ${selectedModel}`);
      
      const analysis = await analyzeSingleReview(reviewId, selectedModel);
      
      if (!analysis) {
        return NextResponse.json(
          { success: false, error: 'Review not found or analysis failed' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: {
          reviewId,
          analysis,
          modelUsed: selectedModel
        }
      });
      
    } else if (action === 'analyze-pending' || !action) {
      // Process all pending reviews (default action)
      console.log(`Processing pending reviews with model: ${selectedModel}`);
      
      const result = await processPendingReviewsWithBedrock(selectedModel);
      
      return NextResponse.json({
        success: true,
        data: {
          processed: result.processed,
          errors: result.errors,
          modelUsed: selectedModel,
          message: `Successfully processed ${result.processed} reviews with ${result.errors} errors`
        }
      });
      
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "analyze-single" or "analyze-pending"' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Bedrock AI API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process AI analysis request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');
    const modelId = searchParams.get('modelId');
    
    if (!reviewId) {
      return NextResponse.json(
        { success: false, error: 'reviewId parameter is required' },
        { status: 400 }
      );
    }
    
    // Validate model ID
    const validModels = Object.values(BEDROCK_MODELS);
    const selectedModel = modelId && validModels.includes(modelId as any) ? modelId as any : BEDROCK_MODELS.LLAMA3_70B_INSTRUCT;
    
    console.log(`GET: Analyzing review ${reviewId} with model: ${selectedModel}`);
    
    const analysis = await analyzeSingleReview(reviewId, selectedModel);
    
    if (!analysis) {
      return NextResponse.json(
        { success: false, error: 'Review not found or analysis failed' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        reviewId,
        analysis,
        modelUsed: selectedModel,
        availableModels: BEDROCK_MODELS
      }
    });
    
  } catch (error) {
    console.error('Bedrock AI GET API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze review' },
      { status: 500 }
    );
  }
}
