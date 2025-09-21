import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get('input');

  if (!input) {
    return NextResponse.json({ success: false, error: 'Input is required' }, { status: 400 });
  }

  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'Google Maps API key not configured' }, { status: 500 });
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=establishment&key=${apiKey}`
    );

    const data = await response.json();

    if (data.status === 'OK') {
      return NextResponse.json({
        success: true,
        predictions: data.predictions
      });
    } else {
      return NextResponse.json({
        success: false,
        error: data.error_message || 'Failed to fetch suggestions'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Places Autocomplete API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}