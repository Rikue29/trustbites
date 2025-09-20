"use client";

import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend);

const mockData = {
  trustScore: 72, // Mock trust score
  distribution: { genuine: 60, suspicious: 25, fake: 15 },
  reviews: [
    {
      id: 1,
      author: "John D.",
      text: "Amazing pizza, would definitely come again! 🍕",
      status: "genuine",
      confidence: 95,
      reason: "Detailed review with unique phrasing",
    },
    {
      id: 2,
      author: "Foodie123",
      text: "Good food. Nice place. Very good. 👍",
      status: "suspicious",
      confidence: 70,
      reason: "Repetitive generic wording",
    },
    {
      id: 3,
      author: "Mike L.",
      text: "Best restaurant ever!!! Highly recommend to everyone!!!",
      status: "fake",
      confidence: 88,
      reason: "Excessive promotion style, overly enthusiastic tone",
    },
  ],
};

export default function AnalysisResults() {
  const pieData = {
    labels: ["Genuine", "Suspicious", "Fake"],
    datasets: [
      {
        data: [
          mockData.distribution.genuine,
          mockData.distribution.suspicious,
          mockData.distribution.fake,
        ],
        backgroundColor: ["#22c55e", "#eab308", "#ef4444"], // green, yellow, red
      },
    ],
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 h-full overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4">AI Review Analysis</h2>

      {/* Trust Score */}
      <div className="mb-6 text-center">
        <div className="text-4xl font-bold text-green-600">
          {mockData.trustScore}%
        </div>
        <p className="text-gray-600">Trust Score</p>
      </div>

      {/* Pie Chart */}
      <div className="mb-6">
        <Pie data={pieData} />
      </div>

      {/* Review List */}
      <div className="space-y-4">
        {mockData.reviews.map((review) => (
          <div
            key={review.id}
            className="p-4 border rounded-lg shadow-sm relative bg-gray-50"
          >
            <p className="text-sm text-gray-700">
              <span className="font-semibold">{review.author}</span>:{" "}
              {review.text}
            </p>
            <span
              className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full ${
                review.status === "genuine"
                  ? "bg-green-100 text-green-700"
                  : review.status === "suspicious"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {review.status === "genuine"
                ? "✅ Genuine"
                : review.status === "suspicious"
                ? "⚠ Suspicious"
                : "❌ Fake"}
            </span>
            <p className="text-xs text-gray-500 mt-2">
              Confidence: {review.confidence}%
            </p>
            <p className="text-xs text-gray-400 italic">
              Why? {review.reason}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
