import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { placeId } = await request.json();

    if (!placeId) {
      return NextResponse.json(
        { error: 'Place ID is required' },
        { status: 400 }
      );
    }

    // Mock analysis data - in production this would call your AI analysis service
    const mockAnalysis = {
      trustScore: Math.floor(Math.random() * 40) + 60, // 60-100
      reviewDistribution: {
        genuine: Math.floor(Math.random() * 30) + 50, // 50-80%
        suspicious: Math.floor(Math.random() * 20) + 15, // 15-35%
        fake: Math.floor(Math.random() * 20) + 5 // 5-25%
      },
      recentReviews: [
        {
          reviewId: '1',
          reviewText: 'Amazing authentic Italian pizza! The margherita was perfectly cooked with fresh basil and mozzarella. Service was excellent and the atmosphere was cozy.',
          isFake: false,
          confidence: 0.92,
          sentiment: 'POSITIVE',
          reason: 'Specific menu details, balanced review with multiple aspects mentioned, natural language flow'
        },
        {
          reviewId: '2',
          reviewText: 'Best pizza ever! Amazing food amazing service amazing everything! Highly recommend to everyone!',
          isFake: true,
          confidence: 0.78,
          sentiment: 'POSITIVE',
          reason: 'Excessive use of superlatives, repetitive "amazing" pattern, lacks specific details'
        },
        {
          reviewId: '3',
          reviewText: 'Great restaurant great food great service great atmosphere great location great prices!',
          isFake: true,
          confidence: 0.95,
          sentiment: 'POSITIVE',
          reason: 'Obvious repetitive pattern, generic praise without specifics, artificial language structure'
        },
        {
          reviewId: '4',
          reviewText: 'Visited last Tuesday with my family. The quattro stagioni pizza was delicious, though the crust could have been crispier. Kids loved the tiramisu for dessert.',
          isFake: false,
          confidence: 0.89,
          sentiment: 'POSITIVE',
          reason: 'Specific visit details, constructive criticism, mentions family context and specific dishes'
        }
      ]
    };

    return NextResponse.json({
      success: true,
      analysis: mockAnalysis
    });

  } catch (error) {
    console.error('Error analyzing restaurant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}