import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const query = searchParams.get('query') || 'restaurant';
  const radius = searchParams.get('radius') || '1000';

  if (!location && (!lat || !lng)) {
    return NextResponse.json(
      { error: 'Location parameter or coordinates are required' },
      { status: 400 }
    );
  }

  if (!GOOGLE_API_KEY) {
    return NextResponse.json(
      { error: 'Google Places API not configured' },
      { status: 500 }
    );
  }

  try {
    let coordinates;
    
    if (lat && lng) {
      coordinates = { lat: parseFloat(lat), lng: parseFloat(lng) };
    } else {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json`;
      const geocodeParams = new URLSearchParams({
        address: location!,
        key: GOOGLE_API_KEY
      });

      const geocodeResponse = await fetch(`${geocodeUrl}?${geocodeParams}`);
      const geocodeData = await geocodeResponse.json();

      if (geocodeData.status !== 'OK' || !geocodeData.results[0]) {
        return NextResponse.json(
          { error: 'Could not find location coordinates' },
          { status: 404 }
        );
      }

      coordinates = geocodeData.results[0].geometry.location;
    }

    // Search for nearby restaurants
    const searchUrl = `${PLACES_API_BASE}/nearbysearch/json`;
    const searchParams = new URLSearchParams({
      location: `${coordinates.lat},${coordinates.lng}`,
      radius: radius,
      type: 'restaurant',
      key: GOOGLE_API_KEY
    });

    const searchResponse = await fetch(`${searchUrl}?${searchParams}`);
    const searchData = await searchResponse.json();

    if (searchData.status !== 'OK') {
      return NextResponse.json(
        { error: `Google Places API error: ${searchData.status}` },
        { status: 500 }
      );
    }

    // Format the results for your frontend
    const restaurants = searchData.results.map((place: any) => {
      const cuisineTypes = place.types?.filter((type: string) => 
        !['establishment', 'point_of_interest', 'food', 'store', 'restaurant'].includes(type)
      ) || [];
      
      return {
        placeId: place.place_id,
        name: place.name,
        address: place.vicinity || place.formatted_address,
        location: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng
        },
        rating: place.rating || 0,
        totalReviews: place.user_ratings_total || 0,
        priceLevel: place.price_level,
        cuisine: cuisineTypes[0] || 'restaurant',
        types: place.types || [],
        isOpen: place.opening_hours?.open_now,
        photos: place.photos?.slice(0, 3).map((photo: any) => ({
          reference: photo.photo_reference,
          width: photo.width,
          height: photo.height,
          url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${GOOGLE_API_KEY}`
        })) || []
      };
    });

    return NextResponse.json({
      success: true,
      location: {
        query: location || 'Current Location',
        coordinates
      },
      restaurants: restaurants.slice(0, 20),
      total: restaurants.length
    });

  } catch (error) {
    console.error('Restaurant search error:', error);
    return NextResponse.json(
      { error: 'Failed to search restaurants' },
      { status: 500 }
    );
  }
}