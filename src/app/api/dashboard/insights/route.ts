import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoClient } from "../../../../lib/aws-config";

const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

export async function GET(request: NextRequest) {
  try {
    console.log('Fake review insights API called');

    // Get all fake reviews
    const reviewsCommand = new ScanCommand({
      TableName: "Reviews"
    });
    const reviewsData = await dynamoDocClient.send(reviewsCommand);
    const allReviews = reviewsData.Items || [];
    const fakeReviews = allReviews.filter(review => review.isFake === true);

    // Analyze fake review patterns
    const insights = {
      totalFakeReviews: fakeReviews.length,
      commonReasons: analyzeCommonReasons(fakeReviews),
      languageBreakdown: analyzeLanguageBreakdown(fakeReviews),
      ratingDistribution: analyzeRatingDistribution(fakeReviews),
      confidenceDistribution: analyzeConfidenceDistribution(fakeReviews),
      topSuspiciousPatterns: analyzeTopPatterns(fakeReviews),
      timePatterns: analyzeTimePatterns(fakeReviews)
    };

    console.log('Fake review insights calculated');
    return NextResponse.json({ success: true, data: insights });

  } catch (error) {
    console.error('Insights API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}

function analyzeCommonReasons(fakeReviews: any[]) {
  const reasonCounts: Record<string, number> = {};
  
  fakeReviews.forEach(review => {
    if (review.reasons && Array.isArray(review.reasons)) {
      review.reasons.forEach((reason: string) => {
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      });
    }
  });

  return Object.entries(reasonCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([reason, count]) => ({ reason, count, percentage: ((count / fakeReviews.length) * 100).toFixed(1) }));
}

function analyzeLanguageBreakdown(fakeReviews: any[]) {
  const languageCounts: Record<string, number> = {};
  
  fakeReviews.forEach(review => {
    const lang = review.language || 'unknown';
    languageCounts[lang] = (languageCounts[lang] || 0) + 1;
  });

  return Object.entries(languageCounts)
    .map(([language, count]) => ({ language, count, percentage: ((count / fakeReviews.length) * 100).toFixed(1) }));
}

function analyzeRatingDistribution(fakeReviews: any[]) {
  const ratingCounts: Record<number, number> = {};
  
  fakeReviews.forEach(review => {
    const rating = review.rating || 0;
    ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
  });

  return Object.entries(ratingCounts)
    .map(([rating, count]) => ({ 
      rating: parseInt(rating), 
      count, 
      percentage: ((count / fakeReviews.length) * 100).toFixed(1) 
    }))
    .sort((a, b) => b.rating - a.rating);
}

function analyzeConfidenceDistribution(fakeReviews: any[]) {
  const ranges = [
    { min: 0.9, max: 1.0, label: 'Very High (90-100%)' },
    { min: 0.8, max: 0.9, label: 'High (80-90%)' },
    { min: 0.7, max: 0.8, label: 'Medium (70-80%)' },
    { min: 0.5, max: 0.7, label: 'Low (50-70%)' },
    { min: 0, max: 0.5, label: 'Very Low (0-50%)' }
  ];

  return ranges.map(range => {
    const count = fakeReviews.filter(review => {
      const confidence = review.confidence || 0;
      return confidence >= range.min && confidence < range.max;
    }).length;

    return {
      label: range.label,
      count,
      percentage: fakeReviews.length > 0 ? ((count / fakeReviews.length) * 100).toFixed(1) : '0'
    };
  });
}

function analyzeTopPatterns(fakeReviews: any[]) {
  // Common suspicious patterns in fake reviews
  const patterns = [
    { pattern: 'excessive_positivity', description: 'Overly positive language' },
    { pattern: 'generic_praise', description: 'Generic praise without specifics' },
    { pattern: 'perfect_rating', description: 'Perfect 5-star rating' },
    { pattern: 'short_review', description: 'Suspiciously short review' },
    { pattern: 'repeated_phrases', description: 'Repeated phrases or templates' },
    { pattern: 'timing_suspicious', description: 'Suspicious timing patterns' }
  ];

  return patterns.map(pattern => {
    const count = fakeReviews.filter(review => 
      review.reasons && review.reasons.some((reason: string) => 
        reason.toLowerCase().includes(pattern.pattern.replace('_', ' '))
      )
    ).length;

    return {
      pattern: pattern.pattern,
      description: pattern.description,
      count,
      percentage: fakeReviews.length > 0 ? ((count / fakeReviews.length) * 100).toFixed(1) : '0'
    };
  }).filter(item => item.count > 0);
}

function analyzeTimePatterns(fakeReviews: any[]) {
  const hourCounts: Record<number, number> = {};
  const dayCounts: Record<string, number> = {};

  fakeReviews.forEach(review => {
    if (review.reviewDate) {
      const date = new Date(review.reviewDate);
      const hour = date.getHours();
      const day = date.toLocaleDateString('en-US', { weekday: 'long' });

      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    }
  });

  return {
    hourlyDistribution: Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => a.hour - b.hour),
    dailyDistribution: Object.entries(dayCounts)
      .map(([day, count]) => ({ day, count }))
  };
}