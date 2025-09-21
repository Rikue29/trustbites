'use client';

import { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import GoogleMap from '@/components/GoogleMap';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

interface Restaurant {
  placeId: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  rating: number;
  totalReviews: number;
  emoji?: string;
  trustScore?: number;
  photos?: { url: string; reference?: string; width?: number; height?: number }[];
  types?: string[];
}

interface Review {
  reviewId: string;
  reviewText: string;
  authorName?: string;
  rating?: number;
  time?: number;
  isFake: boolean;
  confidence: number;
  sentiment: string;
  reason?: string;
}

export default function TrustBitesAI() {
  const [currentScreen, setCurrentScreen] = useState<'map' | 'dashboard'>('map');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          searchNearbyRestaurants(location);
        },
        () => {
          // Fallback to Kuala Lumpur if location denied
          searchRestaurants('Kuala Lumpur');
        }
      );
    } else {
      searchRestaurants('Kuala Lumpur');
    }
  };

  const searchNearbyRestaurants = async (location: {lat: number, lng: number}) => {
    try {
      const response = await fetch(`/api/restaurants/search?lat=${location.lat}&lng=${location.lng}&radius=5000`);
      const data = await response.json();
      
      if (data.success) {
        const restaurantsWithEmojis = data.restaurants.map((r: any) => ({
          ...r,
          emoji: getEmojiForCuisine(r.types || [r.cuisine]),
          trustScore: Math.floor(Math.random() * 40) + 60
        }));
        setRestaurants(restaurantsWithEmojis);
        setSelectedRestaurant(null);
      }
    } catch (error) {
      console.error('Error searching nearby restaurants:', error);
    }
  };

  const getEmojiForCuisine = (types: string[]) => {
    const typeStr = types.join(' ').toLowerCase();
    if (typeStr.includes('pizza') || typeStr.includes('italian')) return '🍕';
    if (typeStr.includes('burger') || typeStr.includes('american')) return '🍔';
    if (typeStr.includes('sushi') || typeStr.includes('japanese')) return '🍣';
    if (typeStr.includes('mexican') || typeStr.includes('taco')) return '🌮';
    if (typeStr.includes('coffee') || typeStr.includes('cafe')) return '☕';
    if (typeStr.includes('chinese')) return '🥢';
    if (typeStr.includes('indian')) return '🍛';
    if (typeStr.includes('thai')) return '🍜';
    if (typeStr.includes('bakery') || typeStr.includes('dessert')) return '🧁';
    if (typeStr.includes('bar') || typeStr.includes('pub')) return '🍺';
    return '🍽️';
  };

  const analyzeRestaurant = async (restaurant: Restaurant) => {
    setIsAnalyzing(true);
    setShowAnalysis(false);
    
    try {
      const response = await fetch(`/api/restaurants/${restaurant.placeId}/reviews`);
      const data = await response.json();
      
      if (data.success) {
        setReviews(data.analysis.recentReviews);
        setSelectedRestaurant({
          ...restaurant,
          trustScore: data.analysis.trustScore
        });
      }
      
      setTimeout(() => {
        setShowAnalysis(true);
        setIsAnalyzing(false);
        // Scroll to reviews section after analysis is complete
        setTimeout(() => {
          reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500);
      }, 2500);
    } catch (error) {
      console.error('Error analyzing reviews:', error);
      setIsAnalyzing(false);
    }
  };

  const fetchSuggestions = (input: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (input.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        console.log('Fetching suggestions for:', input);
        const response = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(input)}`);
        const data = await response.json();
        
        console.log('API response:', data);
        
        if (data.success && data.predictions) {
          setSuggestions(data.predictions);
          setShowSuggestions(true);
        } else {
          console.error('API error:', data.error);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  };

  const searchRestaurants = async (location?: string) => {
    const query = location || searchQuery.trim();
    if (!query) return;
    
    setShowSuggestions(false);
    
    try {
      const response = await fetch(`/api/restaurants/search?location=${encodeURIComponent(query)}&radius=5000`);
      const data = await response.json();
      
      if (data.success) {
        const restaurantsWithEmojis = data.restaurants.map((r: any) => ({
          ...r,
          emoji: getEmojiForCuisine(r.types || [r.cuisine]),
          trustScore: Math.floor(Math.random() * 40) + 60
        }));
        setRestaurants(restaurantsWithEmojis);
        setSelectedRestaurant(null);
      }
    } catch (error) {
      console.error('Error searching restaurants:', error);
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    setSearchQuery(suggestion.description);
    setShowSuggestions(false);
    searchRestaurants(suggestion.description);
  };

  const pieChartData = {
    labels: ['Genuine', 'Suspicious', 'Fake'],
    datasets: [{
      data: [60, 25, 15],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
      borderWidth: 0
    }]
  };

  const trendChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Fake Reviews Detected',
      data: [12, 8, 15, 6, 9, 18, 11],
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">TrustBites AI</h1>
                <p className="text-xs text-gray-500">Fake Review Detector</p>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search restaurants, cuisines, or locations..."
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchQuery(value);
                    fetchSuggestions(value);
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && searchRestaurants()}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm bg-white placeholder-gray-500"
                />
                <button 
                  onClick={() => searchRestaurants()}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-green-500 text-white p-1.5 rounded-lg hover:bg-green-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </button>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                
                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.place_id || index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center space-x-3">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{suggestion.structured_formatting?.main_text || suggestion.description}</p>
                            <p className="text-xs text-gray-500">{suggestion.structured_formatting?.secondary_text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Navigation Tabs */}
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => setCurrentScreen('map')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentScreen === 'map' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Map View
              </button>
              <button 
                onClick={() => setCurrentScreen('dashboard')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentScreen === 'dashboard' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Map View Screen */}
        {currentScreen === 'map' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" style={{minHeight: showAnalysis ? 'calc(100vh - 50px)' : 'calc(100vh - 100px)'}}>
            {/* Map Section */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden relative" style={{height: showAnalysis ? 'calc(100vh - 50px)' : 'calc(100vh - 100px)'}}>
                <GoogleMap 
                  restaurants={restaurants} 
                  onPlaceSelect={(restaurant) => {
                    setSelectedRestaurant(restaurant);
                    analyzeRestaurant(restaurant);
                  }}
                />
                
                {/* Map Legend */}
                <div className="absolute bottom-6 right-6 bg-white rounded-lg shadow-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">Trust Levels</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600">High Trust (80-100%)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-gray-600">Medium Trust (50-79%)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-gray-600">Low Trust (0-49%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Restaurant Card */}
            <div className="lg:col-span-1">
              {selectedRestaurant ? (
                <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col" style={{height: showAnalysis ? 'calc(100vh - 50px)' : 'calc(100vh - 100px)', minHeight: showAnalysis ? '900px' : '800px'}}>
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                      {selectedRestaurant.photos && selectedRestaurant.photos[0] ? (
                        <img 
                          src={selectedRestaurant.photos[0].url} 
                          alt={selectedRestaurant.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl">{selectedRestaurant.emoji}</span>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedRestaurant.name}</h3>
                    
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <div className="flex text-yellow-400 text-lg">
                        {'⭐'.repeat(Math.floor(selectedRestaurant.rating))}
                      </div>
                      <span className="text-gray-600 font-semibold">{selectedRestaurant.rating}</span>
                    </div>
                    
                    <p className="text-gray-500 text-sm mb-3">{selectedRestaurant.totalReviews.toLocaleString()} reviews</p>
                    <p className="text-gray-500 text-sm">{selectedRestaurant.address}</p>
                  </div>
                  
                  <div className="mb-6">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-gray-900">$$$</div>
                      <div className="text-xs text-gray-500">Price Range</div>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto bg-white">
                    {isAnalyzing && (
                      <div className="bg-blue-50 rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="animate-spin w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-blue-600 font-medium">Analyzing reviews...</span>
                        </div>
                      </div>
                    )}

                    {/* Analysis Results */}
                    {showAnalysis && (
                      <div className="bg-gray-50 rounded-xl p-4 overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-base font-bold text-gray-900">AI Analysis Results</h4>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                        
                        {/* Trust Score */}
                        <div className="text-center mb-4">
                          <div className="w-20 h-20 mx-auto mb-3">
                            <Doughnut data={pieChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                          </div>
                          <div className="flex items-center justify-center space-x-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 p-0.5">
                              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-gray-900">{selectedRestaurant.trustScore}</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Trust Score</p>
                              <p className={`text-xs ${
                                selectedRestaurant.trustScore && selectedRestaurant.trustScore >= 80 ? 'text-green-600' :
                                selectedRestaurant.trustScore && selectedRestaurant.trustScore >= 60 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {selectedRestaurant.trustScore && selectedRestaurant.trustScore >= 80 ? 'Highly Trustworthy' :
                                 selectedRestaurant.trustScore && selectedRestaurant.trustScore >= 60 ? 'Moderately Trustworthy' :
                                 'Low Trust'}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mb-1"></div>
                              <div className="font-medium">Genuine</div>
                              <div className="text-gray-500">60%</div>
                            </div>
                            <div className="text-center">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full mx-auto mb-1"></div>
                              <div className="font-medium">Suspicious</div>
                              <div className="text-gray-500">25%</div>
                            </div>
                            <div className="text-center">
                              <div className="w-2 h-2 bg-red-500 rounded-full mx-auto mb-1"></div>
                              <div className="font-medium">Fake</div>
                              <div className="text-gray-500">15%</div>
                            </div>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-6 h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <p className="text-lg font-medium mb-2">Select a Restaurant</p>
                    <p className="text-sm">Click on a restaurant marker on the map to view details and analyze reviews</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dashboard Screen */}
        {currentScreen === 'dashboard' && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Key Metrics */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Trust Overview</h3>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Average Trust Score</span>
                      <span className="font-semibold">74%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: '74%'}}></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">1,247</div>
                      <div className="text-xs text-gray-500">Genuine</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">423</div>
                      <div className="text-xs text-gray-500">Suspicious</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">156</div>
                      <div className="text-xs text-gray-500">Fake</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trend Chart */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Fake Review Trends</h3>
                  <select className="text-sm border border-gray-300 rounded-lg px-3 py-1">
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                  </select>
                </div>
                <div className="h-48">
                  <Line data={trendChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                </div>
              </div>
            </div>

            {/* Suspicious Reviewers Table */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Suspicious Reviewers</h3>
                <button className="text-sm text-green-600 hover:text-green-700 font-medium">View All</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Reviewer</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Risk Level</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Reviews</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Pattern</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium">JD</span>
                          </div>
                          <span className="font-medium">john_doe_123</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          High Risk
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">47 reviews</td>
                      <td className="py-3 px-4 text-gray-600">Generic language</td>
                      <td className="py-3 px-4">
                        <button className="text-green-600 hover:text-green-700 text-sm font-medium">Investigate</button>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium">SF</span>
                          </div>
                          <span className="font-medium">sarah_foodie</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Medium Risk
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">23 reviews</td>
                      <td className="py-3 px-4 text-gray-600">Frequent posting</td>
                      <td className="py-3 px-4">
                        <button className="text-green-600 hover:text-green-700 text-sm font-medium">Investigate</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Competitor Comparison */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Competitor Trust Comparison</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">🍕</span>
                    </div>
                    <div>
                      <div className="font-semibold">Bella Italia</div>
                      <div className="text-sm text-gray-500">Your Restaurant</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">73%</div>
                    <div className="text-sm text-gray-500">Trust Score</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">🍕</span>
                    </div>
                    <div>
                      <div className="font-semibold">Tony's Pizza</div>
                      <div className="text-sm text-gray-500">Competitor</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600">45%</div>
                    <div className="text-sm text-gray-500">Trust Score</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Reviews Section */}
        {currentScreen === 'map' && selectedRestaurant && showAnalysis && (
          <div ref={reviewsRef} className="mt-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Reviews Analysis</h3>
              <div className="space-y-4">
                {reviews.map((review, index) => (
                  <div key={review.reviewId || index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        review.isFake === false ? 'bg-green-100 text-green-700' :
                        review.confidence > 0.7 ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {review.isFake === false ? '✅ Genuine' : review.confidence > 0.7 ? '❌ Fake' : '⚠️ Suspicious'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {Math.round(review.confidence * 100)}%
                      </span>
                    </div>
                    {review.authorName && (
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-gray-700">{review.authorName}</span>
                        {review.rating && (
                          <div className="flex items-center space-x-1">
                            <span className="text-yellow-400">⭐</span>
                            <span className="text-sm text-gray-600">{review.rating}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-sm text-gray-700 leading-relaxed mb-2">{review.reviewText}</p>
                    {review.reason && (
                      <p className="text-xs text-gray-500 italic">Reason: {review.reason}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-bold">TrustBites AI</h3>
              </div>
              <p className="text-gray-400 text-sm">AI-powered fake review detection for restaurants. Make informed dining decisions with confidence.</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Real-time review analysis</li>
                <li>Trust score calculation</li>
                <li>Location-based search</li>
                <li>Interactive maps</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Technology</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>AWS Comprehend AI</li>
                <li>Google Places API</li>
                <li>Next.js & React</li>
                <li>Real-time analytics</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">&copy; 2024 TrustBites AI. Powered by advanced AI technology.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}