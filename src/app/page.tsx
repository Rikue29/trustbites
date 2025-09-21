"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import MapView from "../components/MapView";
import Dashboard from "../components/Dashboard";

export default function Home() {
  const [activeScreen, setActiveScreen] = useState("map");
  const [reviewText, setReviewText] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim() || !restaurantId.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId, reviewText }),
      });
      const data = await response.json();
      setResult(data);
      if (data.success) {
        setReviewText("");
        setRestaurantId("");
      }
    } catch (error) {
      setResult({ error: 'Failed to submit review' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeScreen === "map" ? (
          <MapView />
        ) : (
          <div className="space-y-6">
            <Dashboard />
            
            {/* Review Submission Form */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🔍 Test Review Analysis</h2>
              <form onSubmit={submitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Restaurant ID
                  </label>
                  <input
                    type="text"
                    value={restaurantId}
                    onChange={(e) => setRestaurantId(e.target.value)}
                    placeholder="e.g., bella-italia"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Text
                  </label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Write your review here..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {loading ? "Analyzing..." : "Analyze Review with AI"}
                </button>
              </form>

              {/* Results Display */}
              {result && (
                <div className="mt-6 p-4 rounded-xl border">
                  {result.success ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          result.analysis.isFake 
                            ? "bg-red-100 text-red-700" 
                            : "bg-green-100 text-green-700"
                        }`}>
                          {result.analysis.isFake ? "❌ Potentially Fake" : "✅ Likely Genuine"}
                        </span>
                        <span className="text-sm text-gray-600">
                          Confidence: {Math.round(result.analysis.confidence * 100)}%
                        </span>
                      </div>
                      <div className="text-sm text-gray-700">
                        <strong>Sentiment:</strong> {result.analysis.sentiment}
                      </div>
                      <div className="text-sm text-gray-700">
                        <strong>Language:</strong> {result.analysis.language}
                      </div>
                      <div className="text-sm text-gray-600 italic">
                        {result.analysis.reason}
                      </div>
                    </div>
                  ) : (
                    <div className="text-red-600">
                      Error: {result.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
