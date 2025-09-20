'use client';

import { useState } from 'react';

export default function Home() {
  const [reviewText, setReviewText] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId,
          reviewText,
        }),
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: 'Failed to submit review' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans min-h-screen p-8 bg-gray-50">
      <main className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🍽️ TrustBites</h1>
          <p className="text-gray-600">AI-powered fake review detection for restaurants</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Submit a Review for Analysis</h2>
          
          <form onSubmit={submitReview} className="space-y-4">
            <div>
              <label htmlFor="restaurantId" className="block text-sm font-medium text-gray-700 mb-1">
                Restaurant ID
              </label>
              <input
                type="text"
                id="restaurantId"
                value={restaurantId}
                onChange={(e) => setRestaurantId(e.target.value)}
                placeholder="e.g., restaurant-123"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="reviewText" className="block text-sm font-medium text-gray-700 mb-1">
                Review Text
              </label>
              <textarea
                id="reviewText"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Enter the restaurant review to analyze..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Analyze Review'}
            </button>
          </form>

          {result && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Analysis Result</h3>
              {result.error ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  Error: {result.error}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className={`p-4 rounded-lg ${result.analysis?.isFake ? 'bg-red-100 border border-red-300' : 'bg-green-100 border border-green-300'}`}>
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">
                        {result.analysis?.isFake ? '⚠️' : '✅'}
                      </span>
                      <div>
                        <p className="font-semibold">
                          {result.analysis?.isFake ? 'Likely Fake Review' : 'Appears Genuine'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Confidence: {(result.analysis?.confidence * 100)?.toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-600">
                          {result.analysis?.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-100 p-3 rounded">
                    <p className="text-sm text-gray-600">Review ID: {result.review?.reviewId}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            This is a demo of AI-powered review analysis using AWS services
          </p>
        </div>
      </main>
    </div>
  );
}