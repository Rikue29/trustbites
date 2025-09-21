import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoClient } from "../../../../lib/aws-config-compliant";
import { requireAuth } from "@/lib/auth-middleware";

const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    console.log('Dashboard summary API called');

    // Get all reviews to calculate summary metrics
    const reviewsCommand = new ScanCommand({
      TableName: "Reviews"
    });
    const reviewsData = await dynamoDocClient.send(reviewsCommand);
    const reviews = reviewsData.Items || [];

    // Get all restaurants for additional context
    const restaurantsCommand = new ScanCommand({
      TableName: "Restaurants"
    });
    const restaurantsData = await dynamoDocClient.send(restaurantsCommand);
    const restaurants = restaurantsData.Items || [];

    // Calculate metrics
    const totalReviews = reviews.length;
    const fakeReviews = reviews.filter(review => review.isFake === true);
    const totalFakeReviews = fakeReviews.length;
    const fakeReviewPercentage = totalReviews > 0 ? (totalFakeReviews / totalReviews * 100).toFixed(1) : "0";
    
    // Calculate average rating (excluding fake reviews for accuracy)
    const genuineReviews = reviews.filter(review => review.isFake !== true);
    const totalRating = genuineReviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    const averageRating = genuineReviews.length > 0 ? (totalRating / genuineReviews.length).toFixed(1) : "0";

    // Recent activity (reviews from last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentReviews = reviews.filter(review => {
      if (!review.reviewDate) return false;
      const reviewDate = new Date(review.reviewDate);
      return reviewDate >= sevenDaysAgo;
    });

    const summary = {
      totalReviews,
      totalFakeReviews,
      fakeReviewPercentage: parseFloat(fakeReviewPercentage),
      averageRating: parseFloat(averageRating),
      recentReviewsCount: recentReviews.length,
      totalRestaurants: restaurants.length,
      genuineReviewsCount: genuineReviews.length
    };

    console.log('Dashboard summary calculated:', summary);
    return NextResponse.json({ success: true, data: summary });

  } catch (error) {
    console.error('Dashboard summary API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard summary' },
      { status: 500 }
    );
  }
});
