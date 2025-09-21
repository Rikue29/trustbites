"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GoogleMap, Marker, useLoadScript, Autocomplete } from "@react-google-maps/api";
import AnalysisResults from "./AnalysisResults";

const containerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "1rem",
};

const center = {
  lat: 3.139, // Kuala Lumpur
  lng: 101.6869,
};

const libraries: ("places")[] = ["places"];

export default function MapView() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const fetchReviews = async (placeId: string) => {
    setLoading(true);
    try {
      // Fetch scraped reviews from backend
      const response = await fetch('/api/reviews');
      const data = await response.json();
      if (data.success) {
        // Filter reviews for this restaurant and get scraped reviews
        const restaurantReviews = data.reviews.filter((r: any) => r.restaurantId === placeId);
        setReviews(restaurantReviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const searchNearbyRestaurants = useCallback((map: google.maps.Map, location?: google.maps.LatLng) => {
    const service = new google.maps.places.PlacesService(map);
    const searchLocation = location || map.getCenter() || new google.maps.LatLng(center.lat, center.lng);
    const bounds = map.getBounds();
    const zoom = map.getZoom() || 14;
    
    // Adjust radius based on zoom level
    const radius = Math.min(50000, Math.max(1000, 20000 / Math.pow(2, zoom - 10)));
    
    const request = {
      location: searchLocation,
      radius: radius,
      type: 'restaurant' as google.maps.places.PlaceType,
    };

    service.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        const restaurantData = results.slice(0, 50).map((place, index) => ({
          placeId: index < 2 ? `ChIJN1t_tDeuEmsRUsoyG83frY${index + 4}` : place.place_id,
          name: place.name,
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
          vicinity: place.vicinity,
          position: {
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
          },
          priceLevel: place.price_level,
          types: place.types,
        }));
        setRestaurants(restaurantData);
      }
    });
  }, []);

  const handleMapIdle = useCallback(() => {
    if (map) {
      searchNearbyRestaurants(map);
    }
  }, [map, searchNearbyRestaurants]);

  const handlePlaceSelect = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location && map) {
        map.panTo(place.geometry.location);
        map.setZoom(15);
        searchNearbyRestaurants(map, place.geometry.location);
      }
    }
  };

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    searchNearbyRestaurants(map);
  }, [searchNearbyRestaurants]);

  const onAutocompleteLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  if (!isLoaded) return (
    <div className="flex items-center justify-center h-[calc(100vh-140px)]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading map and restaurants...</p>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      {/* Map Section */}
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg overflow-hidden h-full relative">
        {/* Search Bar */}
        <div className="absolute top-4 left-4 right-4 z-10">
          <Autocomplete
            onLoad={onAutocompleteLoad}
            onPlaceChanged={handlePlaceSelect}
            restrictions={{ country: ['my', 'sg', 'th', 'id', 'ph'] }}
            types={['establishment']}
          >
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search restaurants, places, or areas..."
              className="w-full px-4 py-3 pl-12 bg-white border border-gray-300 rounded-xl shadow-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Autocomplete>
          <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>

        <GoogleMap 
          mapContainerStyle={containerStyle} 
          center={center} 
          zoom={14}
          onLoad={onMapLoad}
          onIdle={handleMapIdle}
          options={{
            gestureHandling: 'greedy',
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          }}
        >
          {restaurants.map((restaurant) => (
            <Marker
              key={restaurant.placeId}
              position={restaurant.position}
              title={restaurant.name}
              onClick={() => {
                setSelectedRestaurant(restaurant);
                fetchReviews(restaurant.placeId);
              }}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="8" fill="#10B981" stroke="white" stroke-width="2"/>
                    <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-family="Arial">🍽️</text>
                  </svg>
                `),
                scaledSize: new google.maps.Size(24, 24),
              }}
            />
          ))}
        </GoogleMap>
        
        {/* Map Info */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900">🍽️ {restaurants.length} Restaurants</p>
          <p className="text-xs text-gray-500">Move map to load more</p>
        </div>
      </div>

      {/* Analysis Panel */}
      <div className="lg:col-span-1">
        {selectedRestaurant ? (
          <AnalysisResults 
            restaurant={selectedRestaurant}
            reviews={reviews} 
            loading={loading} 
            onBack={() => setSelectedRestaurant(null)}
          />
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-6 h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Restaurant</h3>
              <p className="text-gray-500 text-sm">Click on any restaurant marker to view AI-powered review analysis</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
