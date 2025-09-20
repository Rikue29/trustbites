"use client";

interface NavbarProps {
  activeScreen?: string;
  setActiveScreen?: (screen: string) => void;
}

export default function Navbar({ activeScreen, setActiveScreen }: NavbarProps) {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">TrustBites AI</h1>
              <p className="text-xs text-gray-500">Fake Review Detector</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8">
            <input
              type="text"
              placeholder="Search restaurants..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm text-sm"
            />
          </div>

          {/* Navigation Tabs */}
          {setActiveScreen && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setActiveScreen("map")}
                className={`nav-tab px-4 py-2 rounded-lg text-sm font-medium ${
                  activeScreen === "map"
                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Map View
              </button>
              <button
                onClick={() => setActiveScreen("dashboard")}
                className={`nav-tab px-4 py-2 rounded-lg text-sm font-medium ${
                  activeScreen === "dashboard"
                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Dashboard
              </button>
            </div>
          )}

          {/* Profile */}
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
        </div>
      </div>
    </nav>
  );
}
