import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const { businessId } = await params;

  try {
    // Mock data for Blacky CoffeeBar - replace with real database queries
    const businessData = {
      'blacky-coffeebar': {
        businessInfo: {
          name: 'Blacky CoffeeBar',
          address: 'no 2a, 2, Jln 18/33A, Taman Sri Serdang, 43400 Seri Kembangan, Selangor',
          emoji: '☕',
          rating: 4.3,
          totalReviews: 247,
          placeId: 'ChIJd8BlQ2BZzDERYFSMaMOCCwQ'
        },
        summary: {
          totalReviews: 247,
          genuineReviewsCount: 189,
          totalFakeReviews: 23,
          fakeReviewPercentage: 9.3,
          averageRating: 4.3,
          recentReviewsCount: 15,
          totalRestaurants: 1
        },
        trends: {
          period: 7,
          totalReviews: 247,
          fakeReviewRatioOverTime: [
            { date: '2024-01-15', ratio: 0.08 },
            { date: '2024-01-16', ratio: 0.12 },
            { date: '2024-01-17', ratio: 0.06 },
            { date: '2024-01-18', ratio: 0.15 },
            { date: '2024-01-19', ratio: 0.09 },
            { date: '2024-01-20', ratio: 0.11 },
            { date: '2024-01-21', ratio: 0.07 }
          ]
        },
        recentReviews: [
          {
            reviewId: 'review_001',
            reviewText: 'Great coffee and cozy atmosphere! The barista was very friendly and the latte art was beautiful. Perfect spot for working.',
            authorName: 'Sarah M.',
            rating: 5,
            classification: 'genuine',
            confidence: 0.92,
            sentiment: 'positive',
            explanation: 'Specific details about service and atmosphere indicate genuine experience'
          },
          {
            reviewId: 'review_002', 
            reviewText: 'Amazing coffee amazing service amazing place! Best coffee ever! Highly recommend to everyone!',
            authorName: 'John D.',
            rating: 5,
            classification: 'fake',
            confidence: 0.89,
            sentiment: 'positive',
            explanation: 'Repetitive use of "amazing" and generic praise patterns suggest fake review'
          },
          {
            reviewId: 'review_003',
            reviewText: 'Decent coffee but a bit pricey. The wifi was slow and it got quite noisy during lunch hours. Staff could be more attentive.',
            authorName: 'Mike L.',
            rating: 3,
            classification: 'genuine',
            confidence: 0.87,
            sentiment: 'neutral',
            explanation: 'Balanced review with specific criticisms indicates authentic experience'
          }
        ],
        insights: {
          topFakePatterns: ['Excessive superlatives', 'Generic praise', 'Repetitive language'],
          genuineIndicators: ['Specific details', 'Balanced feedback', 'Personal experiences'],
          riskLevel: 'Low',
          monthlyTrend: 'Improving'
        }
      }
    };

    const data = businessData[businessId as keyof typeof businessData];
    
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      business: data.businessInfo,
      summary: data.summary,
      trends: data.trends,
      recentReviews: data.recentReviews,
      insights: data.insights
    });

  } catch (error) {
    console.error('Error fetching business dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}