import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Simple dashboard summary API called');

    // Mock data for testing - replace with real DynamoDB later
    const summary = {
      totalReviews: 35,
      totalFakeReviews: 8,
      fakeReviewPercentage: 22.9,
      averageRating: 4.2,
      recentReviewsCount: 12,
      totalRestaurants: 7,
      genuineReviewsCount: 27
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
}