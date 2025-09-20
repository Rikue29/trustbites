"use client";

import { useState } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import RestaurantCard from "./RestaurantCard";
import AnalysisResults from "./AnalysisResults";

const containerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "1rem",
};

const center = {
  lat: 3.139, // Example: Kuala Lumpur
  lng: 101.6869,
};

export default function MapView() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [analysisVisible, setAnalysisVisible] = useState(false);

  const restaurants = {
    "bella-italia": {
      name: "Bella Italia",
      emoji: "🍕",
      rating: 4.2,
      reviews: 1247,
      address: "123 Main Street",
      position: { lat: 3.139, lng: 101.6869 },
    },
    "burger-junction": {
      name: "Burger Junction",
      emoji: "🍔",
      rating: 4.5,
      reviews: 980,
      address: "45 High Street",
      position: { lat: 3.141, lng: 101.688 },
    },
  };

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  if (!isLoaded) return <p>Loading map...</p>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
      {/* Map Section */}
      <div className="lg:col-span-3 bg-white rounded-2xl shadow-lg overflow-hidden h-full relative">
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={14}>
          {Object.values(restaurants).map((restaurant, idx) => (
            <Marker
              key={idx}
              position={restaurant.position}
              label={restaurant.emoji}
              onClick={() => {
                setSelectedRestaurant(restaurant);
                setAnalysisVisible(false);
              }}
            />
          ))}
        </GoogleMap>
      </div>

      {/* Right Sidebar */}
      <div className="lg:col-span-1">
        {selectedRestaurant && !analysisVisible && (
          <RestaurantCard
            restaurant={selectedRestaurant}
            onAnalyze={() => setAnalysisVisible(true)}
          />
        )}
        {analysisVisible && <AnalysisResults />}
      </div>
    </div>
  );
}
