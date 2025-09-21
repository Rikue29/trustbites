import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place";

// Simple price formatting function
function formatPriceRange(priceLevel: number | undefined) {
  if (priceLevel === undefined || priceLevel === null) {
    return { symbol: '$$$', description: 'Price not available' };
  }
  const priceMap: { [key: number]: { symbol: string; description: string } } = {
    0: { symbol: 'FREE', description: 'Free or very cheap' },
    1: { symbol: '$', description: 'Inexpensive' },
    2: { symbol: '$$', description: 'Moderate' },
    3: { symbol: '$$$', description: 'Expensive' },
    4: { symbol: '$$$$', description: 'Very expensive' }
  };
  return priceMap[priceLevel] || priceMap[2];
}

export async function GET(request: NextRequest) {
  console.log('=== Restaurant Search API Called ===');
  console.log('GOOGLE_API_KEY present:', !!GOOGLE_API_KEY);
  
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const query = searchParams.get('query') || 'restaurant';
  const radius = searchParams.get('radius') || '1000';
  const maxPrice = searchParams.get('maxPrice');
  
  console.log('Request params:', { location, lat, lng, radius });

  if (!location && (!lat || !lng)) {
    console.log('Missing location parameters');
    return NextResponse.json(
      { error: 'Location parameter or coordinates are required' },
      { status: 400 }
    );
  }

  if (!GOOGLE_API_KEY) {
    console.log('Missing Google API key');
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
    
    const fullUrl = `${searchUrl}?${searchParams}`;
    console.log('Google Places API URL:', fullUrl.replace(GOOGLE_API_KEY, 'API_KEY_HIDDEN'));

    const searchResponse = await fetch(fullUrl);
    console.log('Google API response status:', searchResponse.status);
    
    const searchData = await searchResponse.json();
    console.log('Google API response:', { status: searchData.status, results_count: searchData.results?.length });

    if (searchData.status !== 'OK') {
      console.log('Google API error details:', searchData);
      return NextResponse.json(
        { error: `Google Places API error: ${searchData.status}`, details: searchData.error_message },
        { status: 500 }
      );
    }

    // Format the results for your frontend

    let restaurants = searchData.results.map((place: any) => {
      const priceInfo = formatPriceRange(place.price_level);
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

        // Enhanced price information
        priceLevel: place.price_level,
        priceRange: priceInfo,
        cuisine: place.types?.filter((type: string) => 
          !['establishment', 'point_of_interest', 'food'].includes(type)
        )[0] || 'restaurant',
        types: place.types || [],
        isOpen: place.opening_hours?.open_now,
        photos: place.photos?.slice(0, 3).map((photo: any) => ({
          reference: photo.photo_reference,
          width: photo.width,
          height: photo.height
        })) || []
      };
    });

    // Apply price filter if specified
    if (maxPrice !== null && maxPrice !== 'all') {
      const maxPriceLevel = parseInt(maxPrice);
      if (!isNaN(maxPriceLevel) && maxPriceLevel >= 0 && maxPriceLevel <= 4) {
        restaurants = restaurants.filter((restaurant: any) => {
          // Include restaurants with unknown price or price <= maxPriceLevel
          return restaurant.priceLevel === undefined || 
                 restaurant.priceLevel === null || 
                 restaurant.priceLevel <= maxPriceLevel;
        });
      }
    }

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
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      coordinates,
      GOOGLE_API_KEY: GOOGLE_API_KEY ? 'Present' : 'Missing'
    });
    return NextResponse.json(
      { error: 'Failed to search restaurants', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}