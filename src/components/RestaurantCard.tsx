"use client";

interface RestaurantCardProps {
  restaurant: { name: string; emoji: string; rating: number; reviews: number; address: string };
  onAnalyze: () => void;
}

export default function RestaurantCard({ restaurant, onAnalyze }: RestaurantCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 h-full">
      <div className="text-center mb-6">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <span className="text-3xl">{restaurant.emoji}</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{restaurant.name}</h3>
        <div className="flex items-center justify-center space-x-2 mb-2">
          <div className="flex text-yellow-400 text-lg">⭐⭐⭐⭐⭐</div>
          <span className="text-gray-600 font-semibold">{restaurant.rating}</span>
        </div>
        <p className="text-gray-500 text-sm mb-3">{restaurant.reviews} reviews</p>
        <p className="text-gray-500 text-sm">{restaurant.address}</p>
      </div>
      <button
        onClick={onAnalyze}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
      >
        Analyze Reviews with AI
      </button>
    </div>
  );
}
