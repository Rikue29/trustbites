import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoClient } from "../../../../lib/aws-config-compliant";

const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

export async function GET(request: NextRequest) {
  try {
    console.log('Trends API called');

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const periodDays = parseInt(period);

    // Get all reviews
    const reviewsCommand = new ScanCommand({
      TableName: "Reviews"
    });
    const reviewsData = await dynamoDocClient.send(reviewsCommand);
    const allReviews = reviewsData.Items || [];

    // Filter reviews within the specified period
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);
    
    const filteredReviews = allReviews.filter(review => {
      if (!review.reviewDate) return false;
      const reviewDate = new Date(review.reviewDate);
      return reviewDate >= cutoffDate;
    });

    const trends = {
      period: periodDays,
      totalReviews: filteredReviews.length,
      ratingsOverTime: analyzeRatingsOverTime(filteredReviews, periodDays),
      fakeReviewRatioOverTime: analyzeFakeReviewRatioOverTime(filteredReviews, periodDays),
      volumeOverTime: analyzeVolumeOverTime(filteredReviews, periodDays),
      averageRatingTrend: calculateAverageRatingTrend(filteredReviews, periodDays),
      detectionAccuracyTrend: analyzeDetectionAccuracyTrend(filteredReviews, periodDays)
    };

    console.log('Trends analysis completed');
    return NextResponse.json({ success: true, data: trends });

  } catch (error) {
    console.error('Trends API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trends' },
      { status: 500 }
    );
  }
}

function analyzeRatingsOverTime(reviews: any[], periodDays: number) {
  const dailyData: Record<string, { ratings: number[], total: number }> = {};

  // Initialize all days in the period
  for (let i = 0; i < periodDays; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    dailyData[dateKey] = { ratings: [], total: 0 };
  }

  // Group reviews by date (exclude fake reviews for accurate rating trends)
  reviews.filter(review => review.isFake !== true).forEach(review => {
    if (review.reviewDate && review.rating) {
      const dateKey = new Date(review.reviewDate).toISOString().split('T')[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].ratings.push(review.rating);
        dailyData[dateKey].total++;
      }
    }
  });

  // Calculate daily averages
  return Object.entries(dailyData)
    .map(([date, data]) => ({
      date,
      averageRating: data.ratings.length > 0 
        ? parseFloat((data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length).toFixed(2))
        : 0,
      reviewCount: data.total
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function analyzeFakeReviewRatioOverTime(reviews: any[], periodDays: number) {
  const dailyData: Record<string, { total: number, fake: number }> = {};

  // Initialize all days in the period
  for (let i = 0; i < periodDays; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    dailyData[dateKey] = { total: 0, fake: 0 };
  }

  // Count reviews by date
  reviews.forEach(review => {
    if (review.reviewDate) {
      const dateKey = new Date(review.reviewDate).toISOString().split('T')[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].total++;
        if (review.isFake === true) {
          dailyData[dateKey].fake++;
        }
      }
    }
  });

  // Calculate daily fake review ratios
  return Object.entries(dailyData)
    .map(([date, data]) => ({
      date,
      fakeReviewRatio: data.total > 0 
        ? parseFloat(((data.fake / data.total) * 100).toFixed(2))
        : 0,
      totalReviews: data.total,
      fakeReviews: data.fake
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function analyzeVolumeOverTime(reviews: any[], periodDays: number) {
  const dailyData: Record<string, number> = {};

  // Initialize all days in the period
  for (let i = 0; i < periodDays; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    dailyData[dateKey] = 0;
  }

  // Count reviews by date
  reviews.forEach(review => {
    if (review.reviewDate) {
      const dateKey = new Date(review.reviewDate).toISOString().split('T')[0];
      if (dailyData[dateKey] !== undefined) {
        dailyData[dateKey]++;
      }
    }
  });

  return Object.entries(dailyData)
    .map(([date, count]) => ({
      date,
      reviewCount: count
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function calculateAverageRatingTrend(reviews: any[], periodDays: number) {
  const genuineReviews = reviews.filter(review => review.isFake !== true && review.rating);
  const ratings = genuineReviews.map(review => review.rating);
  
  if (ratings.length === 0) {
    return { current: 0, change: 0, trend: 'stable' };
  }

  const midPoint = Math.floor(periodDays / 2);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - midPoint);

  const recentRatings = genuineReviews
    .filter(review => new Date(review.reviewDate) >= cutoffDate)
    .map(review => review.rating);

  const olderRatings = genuineReviews
    .filter(review => new Date(review.reviewDate) < cutoffDate)
    .map(review => review.rating);

  const currentAvg = recentRatings.length > 0 
    ? recentRatings.reduce((sum, rating) => sum + rating, 0) / recentRatings.length
    : 0;

  const previousAvg = olderRatings.length > 0 
    ? olderRatings.reduce((sum, rating) => sum + rating, 0) / olderRatings.length
    : currentAvg;

  const change = currentAvg - previousAvg;
  const trend = Math.abs(change) < 0.1 ? 'stable' : change > 0 ? 'improving' : 'declining';

  return {
    current: parseFloat(currentAvg.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    trend
  };
}

function analyzeDetectionAccuracyTrend(reviews: any[], periodDays: number) {
  const reviewsWithConfidence = reviews.filter(review => 
    review.isFake === true && review.confidence !== undefined
  );

  if (reviewsWithConfidence.length === 0) {
    return { averageConfidence: 0, highConfidenceCount: 0, trend: 'stable' };
  }

  const midPoint = Math.floor(periodDays / 2);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - midPoint);

  const recentConfidences = reviewsWithConfidence
    .filter(review => new Date(review.reviewDate) >= cutoffDate)
    .map(review => review.confidence);

  const olderConfidences = reviewsWithConfidence
    .filter(review => new Date(review.reviewDate) < cutoffDate)
    .map(review => review.confidence);

  const currentAvg = recentConfidences.length > 0 
    ? recentConfidences.reduce((sum, conf) => sum + conf, 0) / recentConfidences.length
    : 0;

  const previousAvg = olderConfidences.length > 0 
    ? olderConfidences.reduce((sum, conf) => sum + conf, 0) / olderConfidences.length
    : currentAvg;

  const change = currentAvg - previousAvg;
  const trend = Math.abs(change) < 0.05 ? 'stable' : change > 0 ? 'improving' : 'declining';

  return {
    averageConfidence: parseFloat(currentAvg.toFixed(3)),
    highConfidenceCount: recentConfidences.filter(conf => conf >= 0.8).length,
    change: parseFloat(change.toFixed(3)),
    trend
  };
}
