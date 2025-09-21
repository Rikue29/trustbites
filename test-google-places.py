"""
Local test script for Google Places API scraper
Run this to test your API key and scraping logic before deploying to Lambda
"""

import os
import json
import requests
from datetime import datetime
from typing import Dict, List, Optional
import uuid

# Load environment variables for local testing
try:
    from dotenv import load_dotenv
    load_dotenv('.env.local')
except ImportError:
    print("Install python-dotenv: pip install python-dotenv")

# Google Places API configuration
GOOGLE_API_KEY = os.environ.get('GOOGLE_PLACES_API_KEY')
PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place"

def search_restaurant(restaurant_name: str, location: str = "Kuala Lumpur, Malaysia") -> Optional[Dict]:
    """Search for restaurant using Google Places API"""
    if not GOOGLE_API_KEY:
        print("❌ Google Places API key not configured")
        return None
    
    search_url = f"{PLACES_API_BASE}/textsearch/json"
    params = {
        'query': f"{restaurant_name} {location}",
        'key': GOOGLE_API_KEY,
        'type': 'restaurant'
    }
    
    try:
        print(f"🔍 Searching for: {restaurant_name} in {location}")
        response = requests.get(search_url, params=params)
        response.raise_for_status()
        data = response.json()
        
        if data['status'] == 'OK' and data['results']:
            result = data['results'][0]
            print(f"✅ Found: {result['name']} at {result.get('formatted_address', 'Unknown address')}")
            return result
        else:
            print(f"❌ No results found. Status: {data.get('status')}")
            if data.get('error_message'):
                print(f"   Error: {data['error_message']}")
            return None
            
    except Exception as e:
        print(f"❌ Error searching restaurant: {e}")
        return None

def get_restaurant_details(place_id: str) -> Optional[Dict]:
    """Get detailed information about restaurant including reviews"""
    details_url = f"{PLACES_API_BASE}/details/json"
    params = {
        'place_id': place_id,
        'key': GOOGLE_API_KEY,
        'fields': 'name,formatted_address,geometry,rating,user_ratings_total,reviews,place_id,types,price_level'
    }
    
    try:
        print(f"📋 Getting details for place_id: {place_id}")
        response = requests.get(details_url, params=params)
        response.raise_for_status()
        data = response.json()
        
        if data['status'] == 'OK':
            result = data['result']
            print(f"✅ Got restaurant details:")
            print(f"   - Name: {result.get('name')}")
            print(f"   - Rating: {result.get('rating')}/5")
            print(f"   - Total Reviews: {result.get('user_ratings_total')}")
            print(f"   - Reviews Available: {len(result.get('reviews', []))}")
            return result
        else:
            print(f"❌ Error getting place details: {data.get('status')}")
            if data.get('error_message'):
                print(f"   Error: {data['error_message']}")
            return None
            
    except Exception as e:
        print(f"❌ Error getting restaurant details: {e}")
        return None

def display_reviews(reviews: List[Dict]):
    """Display sample reviews"""
    print(f"\n📝 Sample Reviews ({len(reviews)} total):")
    for i, review in enumerate(reviews[:3]):  # Show first 3 reviews
        print(f"\n   Review {i+1}:")
        print(f"   Author: {review.get('author_name', 'Anonymous')}")
        print(f"   Rating: {review.get('rating', 0)}⭐")
        print(f"   Text: {review.get('text', '')[:100]}...")
        print(f"   Date: {datetime.fromtimestamp(review.get('time', 0)).strftime('%Y-%m-%d')}")

def test_scraper():
    """Test the scraping functionality"""
    print("🧪 Testing Google Places API Scraper\n")
    
    # Check API key
    if not GOOGLE_API_KEY:
        print("❌ GOOGLE_PLACES_API_KEY not found in environment variables")
        print("Please add it to your .env.local file")
        print("\nSteps to get API key:")
        print("1. Go to https://console.cloud.google.com/")
        print("2. Enable Places API")
        print("3. Create API credentials")
        print("4. Add GOOGLE_PLACES_API_KEY=your_key to .env.local")
        return
    
    print(f"✅ API Key configured: {GOOGLE_API_KEY[:10]}...")
    
    # Test restaurants
    test_restaurants = [
        {"name": "Village Park Restaurant", "location": "Petaling Jaya, Malaysia"},
        {"name": "Jalan Alor Food Street", "location": "Kuala Lumpur, Malaysia"},
        {"name": "Restoran Yut Kee", "location": "Kuala Lumpur, Malaysia"}
    ]
    
    successful_tests = 0
    
    for test_restaurant in test_restaurants:
        print(f"\n{'='*60}")
        print(f"Testing: {test_restaurant['name']}")
        print('='*60)
        
        # Step 1: Search
        restaurant_search = search_restaurant(
            test_restaurant['name'], 
            test_restaurant['location']
        )
        
        if not restaurant_search:
            continue
            
        # Step 2: Get details
        place_id = restaurant_search['place_id']
        restaurant_details = get_restaurant_details(place_id)
        
        if restaurant_details and 'reviews' in restaurant_details:
            display_reviews(restaurant_details['reviews'])
            successful_tests += 1
        
        print(f"\n✅ Test completed for {test_restaurant['name']}")
        print("-" * 60)
    
    print(f"\n🎯 Summary: {successful_tests}/{len(test_restaurants)} restaurants successfully scraped")
    
    if successful_tests > 0:
        print("\n✅ Your Google Places API is working!")
        print("🚀 Ready to deploy to AWS Lambda")
    else:
        print("\n❌ API testing failed. Check your API key and configuration.")

if __name__ == "__main__":
    test_scraper()