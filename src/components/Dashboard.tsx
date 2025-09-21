"use client";

import { useState, useEffect } from "react";
import PieChart from "./charts/PieChart";
import TrendChart from "./charts/TrendChart";

export default function Dashboard() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews');
      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: reviews.length,
    genuine: reviews.filter((r: any) => !r.isFake).length,
    fake: reviews.filter((r: any) => r.isFake).length,
    trustScore: reviews.length > 0 ? Math.round((reviews.filter((r: any) => !r.isFake).length / reviews.length) * 100) : 0
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Analytics Dashboard</h1>
        <p className="text-gray-600">Real-time fake review detection insights</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-gray-600">Total Reviews</div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl font-bold text-green-600">{stats.genuine}</div>
          <div className="text-gray-600">Genuine Reviews</div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl font-bold text-red-600">{stats.fake}</div>
          <div className="text-gray-600">Fake Reviews</div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl font-bold text-purple-600">{stats.trustScore}%</div>
          <div className="text-gray-600">Trust Score</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Review Distribution</h3>
          <PieChart genuine={stats.genuine} fake={stats.fake} />
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Detection Trends</h3>
          <TrendChart />
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Recent Reviews</h3>
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No reviews yet. Submit a review to see analysis results!</p>
        ) : (
          <div className="space-y-3">
            {reviews.slice(-5).reverse().map((review: any, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-gray-900">Restaurant: {review.restaurantId}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    review.isFake ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                  }`}>
                    {review.isFake ? "❌ Fake" : "✅ Genuine"}
                  </span>
                </div>
                <p className="text-gray-700 text-sm mb-2">{review.reviewText}</p>
                <div className="text-xs text-gray-500">
                  Sentiment: {review.sentiment || 'Unknown'} | Language: {review.language || 'Unknown'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}