'use client';

import { useEffect, useRef } from 'react';

interface Restaurant {
  placeId: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  rating: number;
  totalReviews: number;
  emoji?: string;
  trustScore?: number;
  photos?: { url: string }[];
  types?: string[];
}

interface GoogleMapProps {
  restaurants: Restaurant[];
  onPlaceSelect: (restaurant: Restaurant) => void;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function GoogleMap({ restaurants, onPlaceSelect }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google) {
        initializeMap();
        return;
      }

      window.initMap = initializeMap;
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
      script.async = true;
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current) return;

      const center = restaurants.length > 0 
        ? restaurants[0].location 
        : { lat: 3.1390, lng: 101.6869 };

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        zoom: 14,
        center: center
      });

      updateMarkers();
    };

    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      updateMarkers();
    }
  }, [restaurants]);

  const updateMarkers = () => {
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    restaurants.forEach((restaurant) => {
      const marker = new window.google.maps.Marker({
        position: restaurant.location,
        map: mapInstanceRef.current,
        title: restaurant.name,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="${
                restaurant.trustScore && restaurant.trustScore >= 80 ? '#10b981' :
                restaurant.trustScore && restaurant.trustScore >= 60 ? '#f59e0b' : '#ef4444'
              }" stroke="white" stroke-width="2"/>
              <text x="20" y="26" text-anchor="middle" font-size="16" fill="white">${restaurant.emoji || '🍽️'}</text>
            </svg>
          `)}`,
          scaledSize: new window.google.maps.Size(40, 40)
        }
      });

      marker.addListener('click', () => {
        onPlaceSelect(restaurant);
      });

      markersRef.current.push(marker);
    });

    if (restaurants.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      restaurants.forEach(restaurant => {
        bounds.extend(restaurant.location);
      });
      mapInstanceRef.current.fitBounds(bounds);
    }
  };

  return <div ref={mapRef} className="w-full h-full rounded-2xl" />;
}