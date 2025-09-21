"""
Test script for frontend teammates to verify new restaurant APIs
Run this after starting the Next.js server (npm run dev)
"""

import requests
import json

BASE_URL = "http://localhost:3000"

def test_restaurant_search():
    """Test the restaurant search API"""
    print("🔍 Testing Restaurant Search API")
    print("=" * 40)
    
    # Test search for Bukit Bintang restaurants
    url = f"{BASE_URL}/api/restaurants/search"
    params = {
        'location': 'Bukit Bintang, Kuala Lumpur',
        'radius': '1000'
    }
    
    try:
        response = requests.get(url, params=params)
        print(f"📡 GET {url}")
        print(f"📋 Params: {params}")
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success: Found {data['total']} restaurants")
            
            if data['restaurants']:
                first_restaurant = data['restaurants'][0]
                print(f"📍 First result: {first_restaurant['name']}")
                print(f"⭐ Rating: {first_restaurant['rating']} ({first_restaurant['totalReviews']} reviews)")
                return first_restaurant['placeId']
            else:
                print("⚠️  No restaurants found")
                return None
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Connection error: {e}")
        print("   Make sure Next.js server is running (npm run dev)")
        return None

def test_restaurant_details(place_id):
    """Test the restaurant details API"""
    print(f"\n📋 Testing Restaurant Details API")
    print("=" * 40)
    
    url = f"{BASE_URL}/api/restaurants/{place_id}"
    
    try:
        response = requests.get(url)
        print(f"📡 GET {url}")
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            restaurant = data['restaurant']
            reviews = data['reviews']
            
            print(f"✅ Success: {restaurant['name']}")
            print(f"📍 Address: {restaurant['address']}")
            print(f"⭐ Rating: {restaurant['rating']}/5")
            print(f"📝 Reviews fetched: {len(reviews)}")
            
            if reviews:
                first_review = reviews[0]
                print(f"📄 Sample review: {first_review['rating']}⭐ by {first_review['authorName']}")
                print(f"   \"{first_review['reviewText'][:60]}...\"")
            
            return True
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

def main():
    print("🧪 TrustBites Restaurant API Test")
    print("=" * 50)
    print("Make sure your Next.js server is running:")
    print("   npm run dev")
    print("=" * 50)
    
    # Test search API
    place_id = test_restaurant_search()
    
    if place_id:
        # Test details API with the found restaurant
        test_restaurant_details(place_id)
    
    print("\n🎯 Test Summary:")
    print("✅ If both tests passed, your frontend can now:")
    print("   1. Search restaurants by location (Bukit Bintang works!)")
    print("   2. Get real-time reviews for any restaurant")
    print("   3. Use place_id to fetch detailed information")
    print("\n📚 Check DASHBOARD_API_DOCS.md for complete API documentation")

if __name__ == "__main__":
    main()