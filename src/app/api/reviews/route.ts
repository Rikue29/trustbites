import { NextRequest, NextResponse } from 'next/server';
import { addReview, listReviews } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const reviews = await listReviews();
    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { restaurantId, reviewText } = await request.json();

    // Validate input
    if (!restaurantId || !reviewText) {
      return NextResponse.json(
        { error: 'Restaurant ID and review text are required' },
        { status: 400 }
      );
    }

    // Generate unique review ID
    const reviewId = uuidv4();

    // AWS Comprehend-powered fake detection
    const analysis = await detectFakeReview(reviewText);

    // Store in DynamoDB with enhanced data
    const review = await addReview({
      reviewId,
      restaurantId,
      reviewText,
      isFake: analysis.isFake,
      sentiment: analysis.sentiment,
      language: analysis.language,
      confidence: analysis.confidence
    });

    return NextResponse.json({
      success: true,
      review,
      analysis: {
        isFake: analysis.isFake,
        confidence: analysis.confidence,
        sentiment: analysis.sentiment,
        language: analysis.language,
        reason: analysis.explanation
      }
    });

  } catch (error) {
    console.error('Error processing review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// AWS Comprehend-powered fake detection
async function detectFakeReview(text: string): Promise<{
  isFake: boolean;
  confidence: number;
  sentiment: string;
  language: string;
  explanation: string;
}> {
  try {
    const { comprehendClient } = await import('@/lib/aws-config');
    const { DetectSentimentCommand, DetectDominantLanguageCommand } = await import('@aws-sdk/client-comprehend');
    
    // Detect language first
    const languageCommand = new DetectDominantLanguageCommand({ Text: text });
    const languageResult = await comprehendClient.send(languageCommand);
    const dominantLanguage = languageResult.Languages?.[0];
    
    // Detect sentiment
    const sentimentCommand = new DetectSentimentCommand({
      Text: text,
      LanguageCode: dominantLanguage?.LanguageCode || 'en'
    });
    const sentimentResult = await comprehendClient.send(sentimentCommand);
    
    // Advanced fake detection logic
    const sentiment = sentimentResult.Sentiment || 'NEUTRAL';
    const sentimentScore = sentimentResult.SentimentScore;
    
    // Flag as potentially fake if:
    // 1. Extremely positive sentiment (>0.95 confidence)
    // 2. Generic positive words with high confidence
    // 3. Unusual language patterns
    
    let isFake = false;
    let confidence = 0.5;
    let explanation = 'Standard review pattern detected';
    
    if (sentiment === 'POSITIVE' && (sentimentScore?.Positive || 0) > 0.95) {
      isFake = true;
      confidence = sentimentScore?.Positive || 0.7;
      explanation = 'Extremely positive sentiment may indicate fake review';
    } else if (sentiment === 'NEGATIVE' && (sentimentScore?.Negative || 0) > 0.9) {
      // Could also be a fake negative review
      isFake = true;
      confidence = sentimentScore?.Negative || 0.6;
      explanation = 'Extremely negative sentiment may indicate fake review';
    }
    
    // Additional simple keyword checks for common fake patterns
    const fakePositiveIndicators = ['amazing', 'perfect', 'best ever', 'highly recommend', 'five stars'];
    const fakeNegativeIndicators = ['worst', 'terrible', 'never again', 'disgusting', 'awful'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = fakePositiveIndicators.filter(word => lowerText.includes(word)).length;
    const negativeCount = fakeNegativeIndicators.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount >= 3 || negativeCount >= 3) {
      isFake = true;
      confidence = Math.max(confidence, 0.75);
      explanation = `Multiple suspicious ${positiveCount >= 3 ? 'positive' : 'negative'} keywords detected`;
    }
    
    return {
      isFake,
      confidence,
      sentiment,
      language: dominantLanguage?.LanguageCode || 'en',
      explanation
    };
    
  } catch (error) {
    console.error('Comprehend analysis failed, falling back to basic detection:', error);
    
    // Fallback to basic detection
    const fakeIndicators = ['amazing', 'perfect', 'best ever', 'highly recommend'];
    const lowerText = text.toLowerCase();
    const indicatorCount = fakeIndicators.filter(indicator => lowerText.includes(indicator)).length;
    const isFake = indicatorCount >= 3;
    
    return {
      isFake,
      confidence: isFake ? 0.6 : 0.4,
      sentiment: 'UNKNOWN',
      language: 'en',
      explanation: isFake ? 'Basic keyword analysis suggests fake review' : 'Basic analysis suggests genuine review'
    };
  }
}