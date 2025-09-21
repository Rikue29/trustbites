"use client";

import { useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend);

interface AnalysisResultsProps {
  restaurant: any;
  reviews: any[];
  loading: boolean;
  onBack: () => void;
}

export default function AnalysisResults({ restaurant, reviews, loading, onBack }: AnalysisResultsProps) {
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<any>(null);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;
    
    setSubmitting(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          restaurantId: restaurant.placeId, 
          reviewText 
        }),
      });
      const data = await response.json();
      setSubmitResult(data);
      if (data.success) {
        setReviewText("");
        // Refresh reviews after submission
        window.location.reload();
      }
    } catch (error) {
      setSubmitResult({ error: 'Failed to submit review' });
    } finally {
      setSubmitting(false);
    }
  };
  const genuine = reviews.filter(r => !r.isFake).length;
  const fake = reviews.filter(r => r.isFake).length;
  const trustScore = reviews.length > 0 ? Math.round((genuine / reviews.length) * 100) : 0;

  const pieData = {
    labels: ["Genuine", "Fake"],
    datasets: [
      {
        data: [genuine, fake],
        backgroundColor: ["#22c55e", "#ef4444"], // green, red
      },
    ],
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 h-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Loading Analysis...</h2>
          <button onClick={onBack} className="text-gray-500 hover:text-gray-700 text-sm">
            ← Back
          </button>
        </div>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">🔍 Review Analysis</h2>
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700 text-sm">
          ← Back
        </button>
      </div>

      {/* Restaurant Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-xl">
        <h3 className="font-bold text-lg text-gray-900 mb-2">{restaurant.name}</h3>
        <div className="space-y-1 text-sm text-gray-600">
          <p>📍 {restaurant.vicinity}</p>
          <p>⭐ {restaurant.rating || 'N/A'} ({restaurant.userRatingsTotal || 0} reviews)</p>
          {restaurant.priceLevel && (
            <p>💰 {'$'.repeat(restaurant.priceLevel)}</p>
          )}
        </div>
      </div>

      {/* Submit Review Form */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">📝 Test Review Analysis</h4>
        <form onSubmit={submitReview} className="space-y-3">
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Write a review to test AI analysis..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50 text-sm"
          >
            {submitting ? "Analyzing..." : "Analyze with AI"}
          </button>
        </form>

        {/* Submit Result */}
        {submitResult && (
          <div className="mt-3 p-3 rounded-lg border text-sm">
            {submitResult.success ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    submitResult.analysis.isFake 
                      ? "bg-red-100 text-red-700" 
                      : "bg-green-100 text-green-700"
                  }`}>
                    {submitResult.analysis.isFake ? "❌ Potentially Fake" : "✅ Likely Genuine"}
                  </span>
                  <span className="text-xs text-gray-600">
                    {Math.round(submitResult.analysis.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="text-xs text-gray-600 italic">{submitResult.analysis.reason}</p>
              </div>
            ) : (
              <div className="text-red-600">Error: {submitResult.error}</div>
            )}
          </div>
        )}
      </div>

      {/* Scraped Reviews Analysis */}
      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading scraped reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <p className="text-gray-500">No scraped reviews found</p>
          <p className="text-sm text-gray-400 mt-1">Reviews will appear here when scraped from web</p>
        </div>
      ) : (
        <>
          {/* Trust Score */}
          <div className="mb-6 text-center">
            <div className="text-3xl font-bold text-green-600">{trustScore}%</div>
            <p className="text-gray-600 text-sm">Trust Score</p>
            <p className="text-xs text-gray-500 mt-1">Based on {reviews.length} AI analyses</p>
          </div>

          {/* Pie Chart */}
          <div className="mb-6 h-40">
            <Pie data={pieData} />
          </div>

          {/* Scraped Reviews List */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 text-sm flex items-center">
              🌐 Scraped Reviews Analysis
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {reviews.length} found
              </span>
            </h4>
            {reviews.slice(-5).reverse().map((review, index) => (
              <div key={index} className="p-3 border rounded-lg shadow-sm relative bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-medium text-gray-600">
                    {review.author || 'Anonymous'} • {review.date || 'Recent'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    !review.isFake ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {!review.isFake ? "✅ Genuine" : "❌ Fake"}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{review.reviewText || review.text}</p>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Confidence: {Math.round((review.confidence || 0.5) * 100)}%</span>
                  <span>Sentiment: {review.sentiment || 'Unknown'}</span>
                  {review.rating && (
                    <span className="flex items-center">
                      ⭐ {review.rating}/5
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
