import { NextRequest, NextResponse } from 'next/server';
import { detectFakeReviewWithBedrock, BEDROCK_MODELS } from '@/bedrock-ai';

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET(
  request: NextRequest,
  { params }: { params: { placeId: string } }
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
        const analysis = await detectFakeReviewWithBedrock({
          reviewId: review.time.toString(),
          reviewText: review.text,
          rating: review.rating,
          language: 'en',
          authorName: review.author_name,
          reviewDate: new Date(review.time * 1000).toISOString(),
          restaurantName: place.name || 'Unknown Restaurant'
        }, BEDROCK_MODELS.LLAMA3_70B_INSTRUCT);

        return {
          reviewId: review.time.toString(),
          reviewText: review.text,
          authorName: review.author_name,
          rating: review.rating,
          time: review.time,
          isFake: analysis.classification === 'fake',
          classification: analysis.classification,
          confidence: analysis.confidence,
          sentiment: analysis.sentiment,
          reasons: analysis.reasons,
          explanation: analysis.explanation,
          languageConfidence: analysis.languageConfidence
        };
      })
    );

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