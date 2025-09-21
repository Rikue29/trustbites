import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place";

export async function GET(
  request: NextRequest,
  { params }: { params: { placeId: string } }
) {
  const { placeId } = params;

  if (!GOOGLE_API_KEY) {
    return NextResponse.json(
      { error: 'Google Places API not configured' },
      { status: 500 }
    );
  }

  try {
    // Get detailed restaurant information including reviews
    const detailsUrl = `${PLACES_API_BASE}/details/json`;
    const detailsParams = new URLSearchParams({
      place_id: placeId,
      key: GOOGLE_API_KEY,
      fields: 'name,formatted_address,geometry,rating,user_ratings_total,reviews,place_id,types,price_level,opening_hours,formatted_phone_number,website,photos'
    });

    const detailsResponse = await fetch(`${detailsUrl}?${detailsParams}`);
    const detailsData = await detailsResponse.json();

    if (detailsData.status !== 'OK') {
      return NextResponse.json(
        { error: `Google Places API error: ${detailsData.status}` },
        { status: 500 }
      );
    }

    const place = detailsData.result;

    // Format restaurant details
    const restaurant = {
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      },
      rating: place.rating || 0,
      totalReviews: place.user_ratings_total || 0,
      priceLevel: place.price_level,
      phone: place.formatted_phone_number,
      website: place.website,
      cuisine: place.types?.filter((type: string) => 
        !['establishment', 'point_of_interest', 'food'].includes(type)
      )[0] || 'restaurant',
      openingHours: place.opening_hours?.weekday_text || [],
      isOpen: place.opening_hours?.open_now,
      photos: place.photos?.slice(0, 5).map((photo: any) => ({
        reference: photo.photo_reference,
        width: photo.width,
        height: photo.height,
        url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo.photo_reference}&key=${GOOGLE_API_KEY}`
      })) || []
    };

    // Format reviews for TrustBites analysis
    const reviews = (place.reviews || []).map((review: any) => ({
      reviewId: `google_${review.time}_${review.author_name.replace(/\s/g, '_')}`,
      restaurantPlaceId: placeId,
      authorName: review.author_name,
      authorUrl: review.author_url,
      profilePhotoUrl: review.profile_photo_url,
      reviewText: review.text,
      rating: review.rating,
      reviewDate: new Date(review.time * 1000).toISOString(),
      language: review.language || 'en',
      relativeTimeDescription: review.relative_time_description,
      source: 'google_places',
      // Placeholder for AI analysis - to be filled by your AI system
      isFake: null,
      confidence: null,
      sentiment: null,
      reasons: []
    }));

    return NextResponse.json({
      success: true,
      restaurant,
      reviews,
      totalReviews: reviews.length,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Restaurant details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurant details' },
      { status: 500 }
    );
  }
}