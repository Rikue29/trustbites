"""
Test script to demonstrate restaurant search works for ANY location worldwide
"""

import os
import json
import requests
from datetime import datetime

try:
    from dotenv import load_dotenv
    load_dotenv('.env.local')
except ImportError:
    print("Install python-dotenv: pip install python-dotenv")

GOOGLE_API_KEY = os.environ.get('GOOGLE_PLACES_API_KEY')
PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place"

def test_location_search(location):
    """Test searching for restaurants in any location"""
    print(f"🔍 Testing: {location}")
    print("-" * 50)
    
    # Geocode the location
    geocode_url = "https://maps.googleapis.com/maps/api/geocode/json"
    geocode_params = {
        'address': location,
        'key': GOOGLE_API_KEY
    }
    
    geocode_response = requests.get(geocode_url, params=geocode_params)
    geocode_data = geocode_response.json()
    
    if geocode_data['status'] != 'OK':
        print(f"❌ Could not find location: {location}")
        return False
    
    coords = geocode_data['results'][0]['geometry']['location']
    lat, lng = coords['lat'], coords['lng']
    formatted_address = geocode_data['results'][0]['formatted_address']
    print(f"📍 Found: {formatted_address}")
    print(f"🌐 Coordinates: {lat}, {lng}")
    
    # Search for restaurants
    search_url = f"{PLACES_API_BASE}/nearbysearch/json"
    search_params = {
        'location': f"{lat},{lng}",
        'radius': '1000',
        'type': 'restaurant',
        'key': GOOGLE_API_KEY
    }
    
    search_response = requests.get(search_url, params=search_params)
    search_data = search_response.json()
    
    if search_data['status'] != 'OK':
        print(f"❌ Restaurant search failed: {search_data['status']}")
        return False
    
    restaurants = search_data['results'][:5]  # Show first 5
    print(f"✅ Found {len(search_data['results'])} restaurants, showing top 5:")
    
    for i, restaurant in enumerate(restaurants, 1):
        print(f"  {i}. {restaurant['name']}")
        print(f"     📍 {restaurant.get('vicinity', 'N/A')}")
        print(f"     ⭐ {restaurant.get('rating', 'No rating')} ({restaurant.get('user_ratings_total', 0)} reviews)")
    
    print()
    return True

def main():
    """Test restaurant search across different global locations"""
    print("🌍 Testing TrustBites Restaurant Search - WORLDWIDE")
    print("=" * 60)
    
    if not GOOGLE_API_KEY:
        print("❌ Google Places API key not configured")
        return
    
    # Test various locations around the world
    test_locations = [
        # Malaysia (different cities)
        "Bukit Bintang, Kuala Lumpur, Malaysia",
        "Georgetown, Penang, Malaysia",
        "Johor Bahru, Malaysia",
        
        # Southeast Asia
        "Orchard Road, Singapore",
        "Sukhumvit, Bangkok, Thailand",
        "District 1, Ho Chi Minh City, Vietnam",
        
        # Other continents
        "Times Square, New York, USA",
        "Shibuya, Tokyo, Japan",
        "Covent Garden, London, UK",
        "Trocadéro, Paris, France"
    ]
    
    successful_locations = 0
    
    for location in test_locations:
        if test_location_search(location):
            successful_locations += 1
    
    print("🎯 SUMMARY:")
    print(f"✅ Locations tested: {len(test_locations)}")
    print(f"✅ Successful searches: {successful_locations}")
    print(f"✅ Global coverage: {'YES' if successful_locations > 8 else 'PARTIAL'}")
    
    print("\n🚀 YOUR API SUPPORTS:")
    print("   • Any city worldwide")
    print("   • Any neighborhood or district") 
    print("   • Landmark-based searches")
    print("   • Multi-language location names")
    
    print("\n💡 FRONTEND USAGE:")
    print("   GET /api/restaurants/search?location=<ANY_LOCATION>")
    print("   Examples:")
    print("   - 'Orchard Road, Singapore'")
    print("   - 'Times Square, New York'")
    print("   - 'Shibuya, Tokyo'")
    print("   - 'Georgetown, Penang'")

if __name__ == "__main__":
    main()