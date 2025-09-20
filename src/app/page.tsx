"use client";

import Navbar from "../components/Navbar";
import MapView from "../components/MapView";

export default function Home() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <MapView />
      </main>
    </div>
  );
}
