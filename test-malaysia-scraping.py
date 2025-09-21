"""
Test the Google Places scraper with a real Malaysian restaurant
"""

import requests
import json
import os
from datetime import datetime

# This would normally come from environment variables
GOOGLE_API_KEY = "AIzaSyB_cVKxLR2idCaCFLdDavry-pDF6BhNgiQ"  # Your actual key from .env.local
PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place"

def test_malaysia_restaurant_scraping():
    """Test scraping a popular Malaysian restaurant"""
    
    print("🇲🇾 Testing Malaysian Restaurant Scraping")
    print("==========================================\n")
    
    # Test restaurant search
    restaurant_name = "Village Park Restaurant"
    location = "Kuala Lumpur, Malaysia"
    
    print(f"🔍 Searching for: {restaurant_name} in {location}")
    
    # Step 1: Search for the restaurant
    search_url = f"{PLACES_API_BASE}/textsearch/json"
    search_params = {
        'query': f"{restaurant_name} {location}",
        'key': GOOGLE_API_KEY,
        'type': 'restaurant'
    }
    
    try:
        print("📡 Calling Google Places API...")
        response = requests.get(search_url, params=search_params)
        
        if response.status_code == 200:
            data = response.json()
            
            if data['status'] == 'OK' and data['results']:
                restaurant = data['results'][0]
                place_id = restaurant['place_id']
                
                print("✅ Restaurant found!")
                print(f"   📍 Name: {restaurant['name']}")
                print(f"   ⭐ Rating: {restaurant.get('rating', 'N/A')}")
                print(f"   📍 Address: {restaurant.get('formatted_address', 'N/A')}")
                print(f"   🆔 Place ID: {place_id}")
                print()
                
                # Step 2: Get detailed information including reviews
                print("📄 Getting detailed restaurant information...")
                
                details_url = f"{PLACES_API_BASE}/details/json"
                details_params = {
                    'place_id': place_id,
                    'key': GOOGLE_API_KEY,
                    'fields': 'name,formatted_address,geometry,rating,user_ratings_total,reviews,place_id,types,price_level,opening_hours,formatted_phone_number,website'
                }
                
                details_response = requests.get(details_url, params=details_params)
                
                if details_response.status_code == 200:
                    details_data = details_response.json()
                    
                    if details_data['status'] == 'OK':
                        restaurant_details = details_data['result']
                        
                        print("✅ Detailed information retrieved!")
                        print(f"   📞 Phone: {restaurant_details.get('formatted_phone_number', 'N/A')}")
                        print(f"   🌐 Website: {restaurant_details.get('website', 'N/A')}")
                        print(f"   👥 Total Reviews: {restaurant_details.get('user_ratings_total', 'N/A')}")
                        print()
                        
                        # Show reviews
                        reviews = restaurant_details.get('reviews', [])
                        if reviews:
                            print(f"📝 Sample Reviews ({len(reviews)} available):")
                            print("=" * 50)
                            
                            for i, review in enumerate(reviews[:3], 1):  # Show first 3 reviews
                                print(f"\n📋 Review {i}:")
                                print(f"   👤 Author: {review['author_name']}")
                                print(f"   ⭐ Rating: {review['rating']}/5")
                                print(f"   📅 Time: {review['relative_time_description']}")
                                print(f"   💬 Text: {review['text'][:200]}...")
                                if review['text'] != review.get('original_language', ''):
                                    print(f"   🌐 Language: {review.get('language', 'auto-detected')}")
                        
                        # Show what we would store in our database
                        scraped_restaurant_data = {
                            "restaurantId": f"rest_{place_id}",
                            "placeId": place_id,
                            "name": restaurant_details['name'],
                            "address": restaurant_details['formatted_address'],
                            "location": {
                                "lat": restaurant_details['geometry']['location']['lat'],
                                "lng": restaurant_details['geometry']['location']['lng']
                            },
                            "rating": restaurant_details.get('rating'),
                            "totalReviews": restaurant_details.get('user_ratings_total'),
                            "priceLevel": restaurant_details.get('price_level'),
                            "types": restaurant_details.get('types', []),
                            "phone": restaurant_details.get('formatted_phone_number'),
                            "website": restaurant_details.get('website'),
                            "scrapedAt": datetime.now().isoformat(),
                            "reviewCount": len(reviews)
                        }
                        
                        print(f"\n💾 Data Structure for Database Storage:")
                        print("=" * 50)
                        print(json.dumps(scraped_restaurant_data, indent=2))
                        
                        print(f"\n🎯 Scraping Results Summary:")
                        print("=" * 30)
                        print(f"✅ Restaurant found and scraped successfully")
                        print(f"📊 Retrieved {len(reviews)} reviews")
                        print(f"📍 Location: {restaurant_details['formatted_address']}")
                        print(f"⭐ Average rating: {restaurant_details.get('rating', 'N/A')}")
                        print(f"👥 Total reviews on Google: {restaurant_details.get('user_ratings_total', 'N/A')}")
                        
                    else:
                        print(f"❌ Error getting details: {details_data['status']}")
                else:
                    print(f"❌ HTTP Error: {details_response.status_code}")
                    
            else:
                print(f"❌ No restaurants found. Status: {data['status']}")
                
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    print(f"\n🚀 Malaysian Restaurant Scraping Test Complete!")
    print("=" * 50)

if __name__ == "__main__":
    test_malaysia_restaurant_scraping()