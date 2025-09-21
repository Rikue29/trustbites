import { NextRequest, NextResponse } from 'next/server';
// import { detectFakeReviewWithBedrock, BEDROCK_MODELS } from '@/bedrock-ai';

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

    // Simplified analysis without Bedrock for now
    const analyzedReviews = reviews.map((review: any) => {
      // Simple fake detection based on patterns
      const reviewText = review.text.toLowerCase();
      const fakeIndicators = ['amazing', 'perfect', 'best ever', 'highly recommend'];
      const suspiciousIndicators = ['worst', 'terrible', 'horrible', 'never again'];
      
      const fakeCount = fakeIndicators.filter(indicator => reviewText.includes(indicator)).length;
      const suspiciousCount = suspiciousIndicators.filter(indicator => reviewText.includes(indicator)).length;
      
      let classification = 'genuine';
      let confidence = 0.7;
      
      if (fakeCount >= 2) {
        classification = 'fake';
        confidence = 0.8;
      } else if (suspiciousCount >= 2) {
        classification = 'suspicious';
        confidence = 0.7;
      }

      return {
        reviewId: review.time.toString(),
        reviewText: review.text,
        authorName: review.author_name,
        rating: review.rating,
        time: review.time,
        isFake: classification === 'fake',
        classification,
        confidence,
        sentiment: review.rating >= 4 ? 'positive' : review.rating <= 2 ? 'negative' : 'neutral',
        reasons: classification !== 'genuine' ? ['pattern_detected'] : [],
        explanation: `Simple pattern analysis: ${classification}`,
        languageConfidence: 0.8
      };
    });

    const totalReviews = analyzedReviews.length;
    const genuineCount = analyzedReviews.filter(r => r.classification === 'genuine').length;
    const suspiciousCount = analyzedReviews.filter(r => r.classification === 'suspicious').length;
    const fakeCount = analyzedReviews.filter(r => r.classification === 'fake').length;
    
    // Calculate trust score: genuine = 100%, suspicious = 50%, fake = 0%
    const trustScore = totalReviews > 0 
      ? Math.round(((genuineCount * 1.0 + suspiciousCount * 0.5) / totalReviews) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      analysis: {
        trustScore,
        reviewDistribution: {
          genuine: totalReviews > 0 ? Math.round((genuineCount / totalReviews) * 100) : 0,
          suspicious: totalReviews > 0 ? Math.round((suspiciousCount / totalReviews) * 100) : 0,
          fake: totalReviews > 0 ? Math.round((fakeCount / totalReviews) * 100) : 0
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