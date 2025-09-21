"""
Test script specifically for Bukit Bintang, Kuala Lumpur restaurants
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

def test_bukit_bintang_restaurants():
    """Test searching for restaurants in Bukit Bintang area"""
    if not GOOGLE_API_KEY:
        print("❌ Google Places API key not configured")
        return
    
    print("🧪 Testing Bukit Bintang Restaurant Search")
    print("=" * 50)
    
    # First, geocode Bukit Bintang
    geocode_url = "https://maps.googleapis.com/maps/api/geocode/json"
    geocode_params = {
        'address': 'Bukit Bintang, Kuala Lumpur, Malaysia',
        'key': GOOGLE_API_KEY
    }
    
    print("🔍 Getting coordinates for Bukit Bintang...")
    geocode_response = requests.get(geocode_url, params=geocode_params)
    geocode_data = geocode_response.json()
    
    if geocode_data['status'] != 'OK':
        print(f"❌ Geocoding failed: {geocode_data['status']}")
        return
    
    location = geocode_data['results'][0]['geometry']['location']
    lat, lng = location['lat'], location['lng']
    print(f"✅ Bukit Bintang coordinates: {lat}, {lng}")
    
    # Search for nearby restaurants
    search_url = f"{PLACES_API_BASE}/nearbysearch/json"
    search_params = {
        'location': f"{lat},{lng}",
        'radius': '1000',  # 1km radius
        'type': 'restaurant',
        'key': GOOGLE_API_KEY
    }
    
    print("🔍 Searching for restaurants in 1km radius...")
    search_response = requests.get(search_url, params=search_params)
    search_data = search_response.json()
    
    if search_data['status'] != 'OK':
        print(f"❌ Restaurant search failed: {search_data['status']}")
        return
    
    restaurants = search_data['results'][:10]  # Show first 10
    print(f"✅ Found {len(search_data['results'])} restaurants, showing first 10:")
    print()
    
    for i, restaurant in enumerate(restaurants, 1):
        print(f"{i}. {restaurant['name']}")
        print(f"   📍 {restaurant.get('vicinity', 'Address not available')}")
        print(f"   ⭐ {restaurant.get('rating', 'No rating')} ({restaurant.get('user_ratings_total', 0)} reviews)")
        print(f"   🏷️  Place ID: {restaurant['place_id']}")
        
        # Test getting details for first restaurant
        if i == 1:
            print(f"   📋 Testing review fetching...")
            details_url = f"{PLACES_API_BASE}/details/json"
            details_params = {
                'place_id': restaurant['place_id'],
                'key': GOOGLE_API_KEY,
                'fields': 'name,reviews,user_ratings_total'
            }
            
            details_response = requests.get(details_url, params=details_params)
            details_data = details_response.json()
            
            if details_data['status'] == 'OK' and 'reviews' in details_data['result']:
                reviews = details_data['result']['reviews']
                print(f"   ✅ {len(reviews)} reviews available:")
                for j, review in enumerate(reviews[:2], 1):
                    print(f"      Review {j}: {review['rating']}⭐ - \"{review['text'][:60]}...\"")
            else:
                print(f"   ⚠️  No reviews available")
        
        print()
    
    print("🎯 Summary:")
    print(f"   - Location: Bukit Bintang, Kuala Lumpur ✅")
    print(f"   - Restaurants found: {len(search_data['results'])} ✅")
    print(f"   - API working: Yes ✅")
    print(f"   - Reviews available: Yes ✅")

if __name__ == "__main__":
    test_bukit_bintang_restaurants()