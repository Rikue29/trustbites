import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await params;

  if (!GOOGLE_API_KEY) {
    return NextResponse.json(
      { error: 'Google Places API not configured' },
      { status: 500 }
    );
  }

  try {
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json`;
    const detailsParams = new URLSearchParams({
      place_id: placeId,
      fields: 'reviews,name,rating,user_ratings_total',
      key: GOOGLE_API_KEY
    });

    const response = await fetch(`${detailsUrl}?${detailsParams}`);
    const data = await response.json();

    if (data.status !== 'OK') {
      return NextResponse.json(
        { error: `Google Places API error: ${data.status}` },
        { status: 500 }
      );
    }

    const place = data.result;
    const reviews = place.reviews || [];

    const analyzedReviews = await Promise.all(
      reviews.map(async (review: any) => {
        const analysis = await detectFakeReview(review.text);
        return {
          reviewId: review.time.toString(),
          reviewText: review.text,
          authorName: review.author_name,
          rating: review.rating,
          time: review.time,
          isFake: analysis.isFake,
          confidence: analysis.confidence,
          sentiment: analysis.sentiment,
          reason: analysis.explanation
        };
      })
    );

    const totalReviews = analyzedReviews.length;
    const fakeCount = analyzedReviews.filter(r => r.isFake).length;
    const genuineCount = totalReviews - fakeCount;
    const trustScore = totalReviews > 0 ? Math.round((genuineCount / totalReviews) * 100) : 0;

    return NextResponse.json({
      success: true,
      analysis: {
        trustScore,
        reviewDistribution: {
          genuine: Math.round((genuineCount / totalReviews) * 100),
          fake: Math.round((fakeCount / totalReviews) * 100),
          suspicious: 0
        },
        recentReviews: analyzedReviews.slice(0, 5)
      }
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

async function detectFakeReview(text: string): Promise<{
  isFake: boolean;
  confidence: number;
  sentiment: string;
  explanation: string;
}> {
  try {
    const { comprehendClient } = await import('@/lib/aws-config-compliant');
    const { DetectSentimentCommand } = await import('@aws-sdk/client-comprehend');
    
    const sentimentCommand = new DetectSentimentCommand({
      Text: text,
      LanguageCode: 'en'
    });
    const sentimentResult = await comprehendClient.send(sentimentCommand);
    
    const sentiment = sentimentResult.Sentiment || 'NEUTRAL';
    const sentimentScore = sentimentResult.SentimentScore;
    
    let isFake = false;
    let confidence = 0.5;
    let explanation = 'Standard review pattern detected';
    
    if (sentiment === 'POSITIVE' && (sentimentScore?.Positive || 0) > 0.95) {
      isFake = true;
      confidence = sentimentScore?.Positive || 0.7;
      explanation = 'Extremely positive sentiment may indicate fake review';
    }
    
    const fakeIndicators = ['amazing', 'perfect', 'best ever', 'highly recommend', 'five stars'];
    const lowerText = text.toLowerCase();
    const indicatorCount = fakeIndicators.filter(indicator => lowerText.includes(indicator)).length;
    
    if (indicatorCount >= 3) {
      isFake = true;
      confidence = Math.max(confidence, 0.75);
      explanation = 'Multiple suspicious positive keywords detected';
    }
    
    return {
      isFake,
      confidence,
      sentiment,
      explanation
    };
    
  } catch (error) {
    const fakeIndicators = ['amazing', 'perfect', 'best ever'];
    const lowerText = text.toLowerCase();
    const indicatorCount = fakeIndicators.filter(indicator => lowerText.includes(indicator)).length;
    const isFake = indicatorCount >= 2;
    
    return {
      isFake,
      confidence: isFake ? 0.6 : 0.4,
      sentiment: 'UNKNOWN',
      explanation: isFake ? 'Basic keyword analysis suggests fake review' : 'Basic analysis suggests genuine review'
    };
  }
}