import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoClient } from "../../../../lib/aws-config";

const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

export async function GET(request: NextRequest) {
  try {
    console.log('Recent reviews API called');

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const filter = searchParams.get('filter') || 'all'; // 'all', 'fake', 'genuine'

    // Get all reviews
    const reviewsCommand = new ScanCommand({
      TableName: "Reviews"
    });
    const reviewsData = await dynamoDocClient.send(reviewsCommand);
    let reviews = reviewsData.Items || [];

    // Apply filter
    if (filter === 'fake') {
      reviews = reviews.filter(review => review.isFake === true);
    } else if (filter === 'genuine') {
      reviews = reviews.filter(review => review.isFake !== true);
    }

    // Sort by date (most recent first)
    reviews.sort((a, b) => {
      const dateA = new Date(a.reviewDate || '1970-01-01');
      const dateB = new Date(b.reviewDate || '1970-01-01');
      return dateB.getTime() - dateA.getTime();
    });

    // Limit results
    const limitedReviews = reviews.slice(0, limit);

    // Get restaurant info for each review
    const restaurantIds = [...new Set(limitedReviews.map(review => review.restaurantId))];
    const restaurantsCommand = new ScanCommand({
      TableName: "Restaurants"
    });
    const restaurantsData = await dynamoDocClient.send(restaurantsCommand);
    const restaurants = restaurantsData.Items || [];
    
    const restaurantMap = restaurants.reduce((map, restaurant) => {
      map[restaurant.restaurantId] = restaurant;
      return map;
    }, {} as Record<string, any>);

    // Enrich reviews with restaurant data
    const enrichedReviews = limitedReviews.map(review => ({
      reviewId: review.reviewId,
      reviewText: review.reviewText,
      rating: review.rating,
      isFake: review.isFake,
      confidence: review.confidence,
      reasons: review.reasons || [],
      authorName: review.authorName,
      reviewDate: review.reviewDate,
      restaurantId: review.restaurantId,
      restaurant: restaurantMap[review.restaurantId] || null,
      language: review.language || 'en'
    }));

    console.log(`Found ${enrichedReviews.length} recent reviews`);
    return NextResponse.json({ 
      success: true, 
      data: {
        reviews: enrichedReviews,
        total: reviews.length,
        filter,
        limit
      }
    });

  } catch (error) {
    console.error('Recent reviews API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recent reviews' },
      { status: 500 }
    );
  }
}