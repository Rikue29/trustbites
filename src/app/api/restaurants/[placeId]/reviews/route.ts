import { NextRequest, NextResponse } from 'next/server';
import { detectFakeReviewWithBedrock, BEDROCK_MODELS } from '@/bedrock-ai';
import { getExistingAnalysis, saveAnalyzedReview } from '@/lib/db';

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET(
  request: NextRequest,
  { params }: { params: { placeId: string } }
) {
  const { placeId } = await params;
  console.log(`🍽️ === RESTAURANT REVIEWS API CALLED ===`);
  console.log(`🍽️ Place ID: ${placeId}`);

  if (!GOOGLE_API_KEY) {
    console.error(`❌ Google Places API key not configured`);
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
    console.log(`📋 Found ${reviews.length} reviews for ${place.name}`);

    const analyzedReviews = await Promise.all(
      reviews.map(async (review: any, index: number) => {
        console.log(`\n🔍 Processing review ${index + 1}/${reviews.length} by ${review.author_name}`);
        
        // Skip cache lookup for now - just analyze with AI
        console.log(`🤖 Analyzing new review by ${review.author_name} with AI...`);
        
        const analysis = await detectFakeReviewWithBedrock({
          reviewId: review.time.toString(),
          reviewText: review.text,
          rating: review.rating,
          language: 'en',
          authorName: review.author_name,
          reviewDate: new Date(review.time * 1000).toISOString(),
          restaurantName: place.name || 'Unknown Restaurant'
        }, BEDROCK_MODELS.LLAMA3_70B_INSTRUCT);

        // Save analysis to database (without checking for existing data)
        try {
          console.log(`💾 Saving analysis for review by ${review.author_name} to database...`);
          await saveAnalyzedReview({
            restaurantId: placeId,
            reviewId: review.time.toString(),
            reviewText: review.text,
            authorName: review.author_name,
            rating: review.rating,
            reviewDate: new Date(review.time * 1000).toISOString(),
            classification: analysis.classification,
            isFake: analysis.classification === 'fake',
            confidence: analysis.confidence,
            sentiment: analysis.sentiment,
            reasons: analysis.reasons,
            explanation: analysis.explanation,
            languageConfidence: analysis.languageConfidence,
            aiModel: 'bedrock-llama3-70b',
            aiVersion: '1.0'
          });
          console.log(`✅ Successfully saved analysis for review by ${review.author_name}`);
        } catch (saveError) {
          console.error(`❌ Failed to save analysis for review by ${review.author_name}:`, saveError);
          // Continue anyway - the analysis is still valid for display
        }

        const fromCache = false;

        console.log(`✅ Review by ${review.author_name}: ${analysis.classification} (${fromCache ? 'CACHED' : 'NEW'})`);

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
          languageConfidence: analysis.languageConfidence,
          fromCache
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

    console.log(`📊 Analysis Summary: ${totalReviews} total reviews analyzed`);
    console.log(`📈 Trust Score: ${trustScore}% (${genuineCount} genuine, ${suspiciousCount} suspicious, ${fakeCount} fake)`);

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
    console.error('❌ Error in restaurant reviews API:', error);
    
    // Check if it's a specific type of error
    if (error instanceof Error) {
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch reviews',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}