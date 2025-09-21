'use client';

import { useState, useEffect } from 'react';
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
  priceLevel?: number;
  priceRange?: {
    level: number | null;
    symbol: string;
    description: string;
    range: string;
    color?: string;
  };
}

interface Review {
  reviewId: string;
  reviewText: string;
  authorName?: string;
  rating?: number;
  time?: number;
  isFake: boolean;
  classification?: 'genuine' | 'suspicious' | 'fake';
  confidence: number;
  sentiment: string;
  reason?: string;
  reasons?: string[];
  explanation?: string;
  languageConfidence?: number;
}

interface DashboardSummary {
  totalReviews: number;
  totalFakeReviews: number;
  fakeReviewPercentage: number;
  averageRating: number;
  recentReviewsCount: number;
  totalRestaurants: number;
  genuineReviewsCount: number;
}

interface TrendData {
  period: number;
  totalReviews: number;
  fakeReviewRatioOverTime: { date: string; ratio: number }[];
  volumeOverTime: { date: string; volume: number }[];
}

export default function TrustBitesAI() {
  const [currentScreen, setCurrentScreen] = useState<'map' | 'dashboard'>('map');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [searchQuery, setSearchQuery] = useState('Kuala Lumpur');
  
  // Dashboard data states
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  useEffect(() => {
    searchRestaurants('Kuala Lumpur');
    // Load dashboard data when component mounts
    if (currentScreen === 'dashboard') {
      loadDashboardData();
    }
  }, []);

  useEffect(() => {
    // Load dashboard data when switching to dashboard
    if (currentScreen === 'dashboard' && !dashboardSummary) {
      loadDashboardData();
    }
  }, [currentScreen]);

  const loadDashboardData = async () => {
    setIsLoadingDashboard(true);
    try {
      // Fetch dashboard summary
      const summaryResponse = await fetch('/api/dashboard/summary');
      const summaryData = await summaryResponse.json();
      
      if (summaryData.success) {
        setDashboardSummary(summaryData.data);
      }

      // Fetch trend data
      const trendsResponse = await fetch('/api/dashboard/trends?period=7');
      const trendsData = await trendsResponse.json();
      
      if (trendsData.success) {
        setTrendData(trendsData.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoadingDashboard(false);
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

  const analyzeReviews = async () => {
    if (!selectedRestaurant) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch(`/api/restaurants/${selectedRestaurant.placeId}/reviews`);
      const data = await response.json();
      
      if (data.success) {
        setReviews(data.analysis.recentReviews);
        setSelectedRestaurant(prev => prev ? {
          ...prev,
          trustScore: data.analysis.trustScore
        } : null);
      }
      
      setTimeout(() => {
        setShowAnalysis(true);
        setIsAnalyzing(false);
      }, 2500);
    } catch (error) {
      console.error('Error analyzing reviews:', error);
      setIsAnalyzing(false);
    }
  };

  const searchRestaurants = async (location?: string) => {
    const query = location || searchQuery.trim();
    if (!query) return;
    
    try {
      const response = await fetch(`/api/restaurants/search?location=${encodeURIComponent(query)}&radius=5000`);
      const data = await response.json();
      
      if (data.success) {
        const restaurantsWithEmojis = data.restaurants.map((r: any) => ({
          ...r,
          emoji: getEmojiForCuisine(r.types || [r.cuisine]),
          // Remove hardcoded trust score - will be calculated from real analysis
          trustScore: null
        }));
        setRestaurants(restaurantsWithEmojis);
        setSelectedRestaurant(null);
      }
    } catch (error) {
      console.error('Error searching restaurants:', error);
    }
  };

  // Generate chart data from real dashboard data
  const pieChartData = {
    labels: ['Genuine', 'Suspicious', 'Fake'],
    datasets: [{
      data: dashboardSummary ? [
        dashboardSummary.genuineReviewsCount,
        Math.max(0, dashboardSummary.totalReviews - dashboardSummary.genuineReviewsCount - dashboardSummary.totalFakeReviews), // Suspicious
        dashboardSummary.totalFakeReviews
      ] : [60, 25, 15], // Fallback values
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
      borderWidth: 0
    }]
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const value = context.parsed;
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${context.label}: ${percentage}% (${value.toLocaleString()} reviews)`;
          }
        }
      }
    }
  };

  const trendChartData = {
    labels: trendData?.fakeReviewRatioOverTime?.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }) || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Fake Reviews Detected',
      data: trendData?.fakeReviewRatioOverTime?.map(item => Math.round(item.ratio * 100)) || [12, 8, 15, 6, 9, 18, 11],
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Fake Reviews: ${context.parsed.y}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return value + '%';
          }
        }
      }
    }
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchRestaurants()}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm text-sm"
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
            {/* Map Section */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-full relative">
                <GoogleMap 
                  restaurants={restaurants} 
                  onPlaceSelect={(restaurant) => {
                    setSelectedRestaurant(restaurant);
                    setShowAnalysis(false);
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
                <div className="bg-white rounded-2xl shadow-lg p-6 h-full">
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
                  
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {selectedRestaurant.priceRange?.range || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">Price Range</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-gray-900">25min</div>
                      <div className="text-xs text-gray-500">Delivery</div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={analyzeReviews}
                    disabled={isAnalyzing}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    <span className="flex items-center justify-center space-x-2">
                      {isAnalyzing ? (
                        <>
                          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                          </svg>
                          <span>Analyze Reviews with AI</span>
                        </>
                      )}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-6 h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <p className="text-lg font-medium mb-2">Select a Restaurant</p>
                    <p className="text-sm">Click on a restaurant from the list to view details and analyze reviews</p>
                  </div>
                </div>
              )}

              {/* Analysis Results */}
              {showAnalysis && selectedRestaurant && (
                <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-lg font-bold text-gray-900">AI Analysis Results</h4>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-1 animate-pulse"></div>
                        Bedrock AI
                      </span>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  
                  {/* Trust Score Gauge */}
                  <div className="text-center mb-6">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <div className="w-full h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 p-3">
                        <div className="w-full h-full bg-white rounded-full flex items-center justify-center shadow-inner">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">
                              {reviews.length > 0 
                                ? Math.round(100 - (reviews.filter(r => 
                                    r.classification === 'fake' || 
                                    r.classification === 'suspicious' || 
                                    (!r.classification && r.isFake)
                                  ).length / reviews.length) * 100)
                                : (selectedRestaurant?.trustScore || 85)
                              }
                            </div>
                            <div className="text-xs text-gray-500 font-medium">Trust Score</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className={`text-sm font-medium ${
                      reviews.length > 0 
                        ? (100 - (reviews.filter(r => 
                            r.classification === 'fake' || 
                            r.classification === 'suspicious' || 
                            (!r.classification && r.isFake)
                          ).length / reviews.length) * 100) >= 80 ? 'text-green-600' :
                          (100 - (reviews.filter(r => 
                            r.classification === 'fake' || 
                            r.classification === 'suspicious' || 
                            (!r.classification && r.isFake)
                          ).length / reviews.length) * 100) >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        : selectedRestaurant?.trustScore && selectedRestaurant.trustScore >= 80 ? 'text-green-600' :
                          selectedRestaurant?.trustScore && selectedRestaurant.trustScore >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                    }`}>
                      {reviews.length > 0 
                        ? (100 - (reviews.filter(r => 
                            r.classification === 'fake' || 
                            r.classification === 'suspicious' || 
                            (!r.classification && r.isFake)
                          ).length / reviews.length) * 100) >= 80 ? 'Highly Trustworthy' :
                          (100 - (reviews.filter(r => 
                            r.classification === 'fake' || 
                            r.classification === 'suspicious' || 
                            (!r.classification && r.isFake)
                          ).length / reviews.length) * 100) >= 60 ? 'Moderately Trustworthy' :
                          'Low Trust'
                        : selectedRestaurant?.trustScore && selectedRestaurant.trustScore >= 80 ? 'Highly Trustworthy' :
                          selectedRestaurant?.trustScore && selectedRestaurant.trustScore >= 60 ? 'Moderately Trustworthy' :
                          'Low Trust'
                      }
                    </p>
                  </div>

                  {/* Pie Chart */}
                  <div className="mb-6">
                    <h5 className="font-semibold text-gray-900 mb-3">Review Distribution</h5>
                    <div className="h-48 mb-4">
                      {reviews.length > 0 ? (
                        <Doughnut 
                          data={{
                            labels: ['Genuine', 'Suspicious', 'Fake'],
                            datasets: [{
                              data: [
                                reviews.filter(r => r.classification === 'genuine' || (!r.classification && !r.isFake)).length,
                                reviews.filter(r => r.classification === 'suspicious' || (!r.classification && r.isFake && r.confidence < 0.8)).length,
                                reviews.filter(r => r.classification === 'fake' || (!r.classification && r.isFake && r.confidence >= 0.8)).length
                              ],
                              backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                              borderWidth: 0
                            }]
                          }} 
                          options={{ 
                            responsive: true, 
                            maintainAspectRatio: false, 
                            plugins: { 
                              legend: { display: false },
                              tooltip: {
                                callbacks: {
                                  label: function(context: any) {
                                    const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                                    const value = context.parsed;
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                    return `${context.label}: ${percentage}% (${value} reviews)`;
                                  }
                                }
                              }
                            } 
                          }} 
                        />
                      ) : (
                        <Doughnut 
                          data={pieChartData} 
                          options={pieChartOptions} 
                        />
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1"></div>
                        <div className="font-medium">Genuine</div>
                        <div className="text-gray-500">
                          {reviews.length > 0 
                            ? `${Math.round((reviews.filter(r => r.classification === 'genuine' || (!r.classification && !r.isFake)).length / reviews.length) * 100)}%`
                            : '60%'
                          }
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto mb-1"></div>
                        <div className="font-medium">Suspicious</div>
                        <div className="text-gray-500">
                          {reviews.length > 0 
                            ? `${Math.round((reviews.filter(r => r.classification === 'suspicious' || (!r.classification && r.isFake && r.confidence < 0.8)).length / reviews.length) * 100)}%`
                            : '25%'
                          }
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-1"></div>
                        <div className="font-medium">Fake</div>
                        <div className="text-gray-500">
                          {reviews.length > 0 
                            ? `${Math.round((reviews.filter(r => r.classification === 'fake' || (!r.classification && r.isFake && r.confidence >= 0.8)).length / reviews.length) * 100)}%`
                            : '15%'
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Review List */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-semibold text-gray-900">Recent Reviews</h5>
                      {reviews.length > 0 && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {reviews.length} reviews analyzed by AI
                        </span>
                      )}
                    </div>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {reviews.map((review, index) => (
                        <div key={review.reviewId || index} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                          {/* Header with classification and confidence */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                                // Use new classification if available, otherwise fall back to old logic
                                review.classification === 'genuine' || (!review.classification && !review.isFake) ? 'bg-green-100 text-green-800 border-green-200' :
                                review.classification === 'suspicious' || (!review.classification && review.isFake && review.confidence < 0.8) ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                'bg-red-100 text-red-800 border-red-200'
                              }`}>
                                {review.classification === 'genuine' || (!review.classification && !review.isFake) ? '✅ Genuine' : 
                                 review.classification === 'suspicious' || (!review.classification && review.isFake && review.confidence < 0.8) ? '⚠️ Suspicious' :
                                 '❌ Fake'}
                              </span>
                              <span className={`text-xs font-medium ${
                                review.classification === 'genuine' || (!review.classification && !review.isFake) ? 'text-green-600' :
                                review.classification === 'suspicious' || (!review.classification && review.isFake && review.confidence < 0.8) ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {Math.round(review.confidence * 100)}% confidence
                              </span>
                            </div>
                          </div>

                          {/* Author and rating info */}
                          {review.authorName && (
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-medium text-gray-600">{review.authorName}</span>
                                {review.rating && (
                                  <div className="flex items-center space-x-1">
                                    <span className="text-yellow-400">⭐</span>
                                    <span className="text-xs text-gray-600">{review.rating}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center space-x-3 text-xs text-gray-500">
                                <span className="flex items-center space-x-1">
                                  <span>😊</span>
                                  <span>{review.sentiment}</span>
                                </span>
                                {review.languageConfidence && (
                                  <span className="flex items-center space-x-1">
                                    <span>🗣️</span>
                                    <span>{Math.round(review.languageConfidence * 100)}%</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Review text */}
                          <p className="text-sm text-gray-700 leading-relaxed mb-3">{review.reviewText}</p>

                          {/* AI Analysis Explanation */}
                          {review.explanation && (
                            <div className="mb-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                              <div className="text-xs font-medium text-blue-800 mb-1 flex items-center space-x-1">
                                <span>🤖</span>
                                <span>AI Analysis:</span>
                              </div>
                              <div className="text-xs text-blue-700 leading-relaxed">
                                {review.explanation}
                              </div>
                            </div>
                          )}

                          {/* Detection reasons for fake and suspicious reviews */}
                          {(review.classification === 'fake' || review.classification === 'suspicious' || 
                            (!review.classification && review.isFake)) && (review.reasons || review.reason) && (
                            <div className={`p-3 rounded-lg border ${
                              review.classification === 'suspicious' || (!review.classification && review.isFake && review.confidence < 0.8)
                                ? 'bg-yellow-50 border-yellow-100'
                                : 'bg-red-50 border-red-100'
                            }`}>
                              <div className={`text-xs font-medium mb-2 flex items-center space-x-1 ${
                                review.classification === 'suspicious' || (!review.classification && review.isFake && review.confidence < 0.8)
                                  ? 'text-yellow-800'
                                  : 'text-red-800'
                              }`}>
                                <span>⚠️</span>
                                <span>Detection Indicators:</span>
                              </div>
                              <div className={`text-xs ${
                                review.classification === 'suspicious' || (!review.classification && review.isFake && review.confidence < 0.8)
                                  ? 'text-yellow-700'
                                  : 'text-red-700'
                              }`}>
                                {Array.isArray(review.reasons) 
                                  ? (
                                    <ul className="list-disc list-inside space-y-1">
                                      {review.reasons.map((reason, idx) => (
                                        <li key={idx}>{reason.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</li>
                                      ))}
                                    </ul>
                                  )
                                  : review.reason
                                }
                              </div>
                            </div>
                          )}

                          {/* Assessment for genuine reviews */}
                          {(review.classification === 'genuine' || (!review.classification && !review.isFake)) && (
                            <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                              <div className="text-xs font-medium text-green-800 mb-1 flex items-center space-x-1">
                                <span>✅</span>
                                <span>Assessment:</span>
                              </div>
                              <div className="text-xs text-green-700">
                                This review appears to be written by a real customer with authentic experiences.
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dashboard Screen */}
        {currentScreen === 'dashboard' && (
          <div>
            {/* Dashboard Header with Refresh Button */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">AI Analytics Dashboard</h2>
                <p className="text-gray-600">Real-time fake review detection insights</p>
              </div>
              <button
                onClick={loadDashboardData}
                disabled={isLoadingDashboard}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <svg className={`w-4 h-4 ${isLoadingDashboard ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                <span>{isLoadingDashboard ? 'Refreshing...' : 'Refresh Data'}</span>
              </button>
            </div>

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
                
                {isLoadingDashboard ? (
                  <div className="space-y-4 animate-pulse">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {[1,2,3].map(i => (
                        <div key={i}>
                          <div className="h-8 bg-gray-200 rounded mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Average Trust Score</span>
                        <span className="font-semibold">
                          {dashboardSummary 
                            ? `${Math.round(100 - dashboardSummary.fakeReviewPercentage)}%`
                            : '74%'
                          }
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{
                            width: dashboardSummary 
                              ? `${Math.round(100 - dashboardSummary.fakeReviewPercentage)}%`
                              : '74%'
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {dashboardSummary ? dashboardSummary.genuineReviewsCount.toLocaleString() : '1,247'}
                        </div>
                        <div className="text-xs text-gray-500">Genuine</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">
                          {dashboardSummary 
                            ? Math.max(0, dashboardSummary.totalReviews - dashboardSummary.genuineReviewsCount - dashboardSummary.totalFakeReviews).toLocaleString()
                            : '423'
                          }
                        </div>
                        <div className="text-xs text-gray-500">Suspicious</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">
                          {dashboardSummary ? dashboardSummary.totalFakeReviews.toLocaleString() : '156'}
                        </div>
                        <div className="text-xs text-gray-500">Fake</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Trend Chart */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-gray-900">Fake Review Trends</h3>
                    {dashboardSummary && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                        Live Data
                      </span>
                    )}
                  </div>
                  <select className="text-sm border border-gray-300 rounded-lg px-3 py-1">
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                  </select>
                </div>
                {isLoadingDashboard ? (
                  <div className="h-48 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
                    <div className="text-gray-400">Loading trend data...</div>
                  </div>
                ) : (
                  <div className="h-48">
                    <Line 
                      data={trendChartData} 
                      options={trendChartOptions} 
                    />
                  </div>
                )}
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
      </div>
    </div>
  );
}