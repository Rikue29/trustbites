import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place";

import { formatPriceRange } from '@/lib/price-utils';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location');
  const query = searchParams.get('query') || 'restaurant';
  const radius = searchParams.get('radius') || '1000'; // 1km default
  const maxPrice = searchParams.get('maxPrice'); // Optional price filter (0-4)

  if (!location) {
    return NextResponse.json(
      { error: 'Location parameter is required' },
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
    // First, geocode the location to get coordinates
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json`;
    const geocodeParams = new URLSearchParams({
      address: location,
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

    const { lat, lng } = geocodeData.results[0].geometry.location;

    // Search for nearby restaurants
    const searchUrl = `${PLACES_API_BASE}/nearbysearch/json`;
    const searchParams = new URLSearchParams({
      location: `${lat},${lng}`,
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
        query: location,
        coordinates: { lat, lng }
      },
      restaurants: restaurants.slice(0, 20), // Limit to 20 restaurants
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