"""
Live Restaurant Scraping: Bukit Bintang, Kuala Lumpur
======================================================
Real-time scraping of restaurants and reviews from a popular KL area
"""

import requests
import json
from datetime import datetime
import time

GOOGLE_API_KEY = "AIzaSyB_cVKxLR2idCaCFLdDavry-pDF6BhNgiQ"
PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place"

def live_scrape_bukit_bintang():
    """Live scrape restaurants in Bukit Bintang area with real reviews"""
    
    print("🔴 LIVE: Scraping Bukit Bintang, Kuala Lumpur")
    print("=" * 50)
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Search for restaurants in Bukit Bintang
    search_location = "Bukit Bintang, Kuala Lumpur, Malaysia"
    
    print(f"🎯 Target Area: {search_location}")
    print("🔍 Searching for restaurants...")
    
    # Use Nearby Search for area-based results
    nearby_url = f"{PLACES_API_BASE}/nearbysearch/json"
    
    # Get coordinates for Bukit Bintang first
    geocode_url = "https://maps.googleapis.com/maps/api/geocode/json"
    geocode_params = {
        'address': search_location,
        'key': GOOGLE_API_KEY
    }
    
    geocode_response = requests.get(geocode_url, params=geocode_params)
    geocode_data = geocode_response.json()
    
    if geocode_data['status'] != 'OK':
        print("❌ Failed to get location coordinates")
        return
    
    location = geocode_data['results'][0]['geometry']['location']
    print(f"📍 Coordinates: {location['lat']}, {location['lng']}")
    
    # Search for restaurants nearby
    search_params = {
        'location': f"{location['lat']},{location['lng']}",
        'radius': 1000,  # 1km radius
        'type': 'restaurant',
        'key': GOOGLE_API_KEY
    }
    
    print("\n🔄 Fetching restaurants...")
    response = requests.get(nearby_url, params=search_params)
    
    if response.status_code != 200:
        print(f"❌ API Error: {response.status_code}")
        return
    
    data = response.json()
    
    if data['status'] != 'OK':
        print(f"❌ Search failed: {data['status']}")
        return
    
    restaurants = data['results']
    print(f"✅ Found {len(restaurants)} restaurants in Bukit Bintang area")
    print()
    
    # Select top 5 restaurants for detailed scraping
    top_restaurants = sorted(restaurants, key=lambda x: x.get('rating', 0), reverse=True)[:5]
    
    scraped_data = []
    
    for i, restaurant in enumerate(top_restaurants, 1):
        print(f"🏪 Restaurant {i}/5: {restaurant['name']}")
        print("-" * 40)
        print(f"⭐ Rating: {restaurant.get('rating', 'N/A')}")
        print(f"💰 Price Level: {restaurant.get('price_level', 'N/A')}")
        print(f"👥 Total Ratings: {restaurant.get('user_ratings_total', 'N/A')}")
        
        # Get detailed information with reviews
        print("📄 Fetching detailed reviews...")
        
        details_url = f"{PLACES_API_BASE}/details/json"
        details_params = {
            'place_id': restaurant['place_id'],
            'key': GOOGLE_API_KEY,
            'fields': 'name,formatted_address,rating,user_ratings_total,reviews,opening_hours,formatted_phone_number,website,photos'
        }
        
        details_response = requests.get(details_url, params=details_params)
        
        if details_response.status_code == 200:
            details_data = details_response.json()
            
            if details_data['status'] == 'OK':
                restaurant_details = details_data['result']
                reviews = restaurant_details.get('reviews', [])
                
                print(f"✅ Retrieved {len(reviews)} live reviews")
                
                # Show real reviews
                if reviews:
                    print("\n📝 LIVE REVIEWS:")
                    print("=" * 30)
                    
                    for j, review in enumerate(reviews[:3], 1):  # Show first 3 reviews
                        print(f"\n💬 Review {j}:")
                        print(f"   👤 {review['author_name']}")
                        print(f"   ⭐ {review['rating']}/5 stars")
                        print(f"   📅 {review['relative_time_description']}")
                        print(f"   📝 \"{review['text'][:150]}{'...' if len(review['text']) > 150 else ''}\"")
                        
                        # Language detection
                        if 'language' in review:
                            print(f"   🌐 Language: {review['language']}")
                
                # Store scraped data
                restaurant_data = {
                    "scrapedAt": datetime.now().isoformat(),
                    "placeId": restaurant['place_id'],
                    "name": restaurant_details['name'],
                    "address": restaurant_details.get('formatted_address', ''),
                    "rating": restaurant_details.get('rating'),
                    "totalReviews": restaurant_details.get('user_ratings_total'),
                    "phone": restaurant_details.get('formatted_phone_number'),
                    "website": restaurant_details.get('website'),
                    "area": "Bukit Bintang, Kuala Lumpur",
                    "liveReviews": [
                        {
                            "author": review['author_name'],
                            "rating": review['rating'],
                            "text": review['text'],
                            "time": review['relative_time_description'],
                            "language": review.get('language', 'unknown')
                        } for review in reviews[:5]  # Store first 5 reviews
                    ]
                }
                
                scraped_data.append(restaurant_data)
                
            else:
                print(f"❌ Failed to get details: {details_data['status']}")
        else:
            print(f"❌ HTTP Error: {details_response.status_code}")
        
        print()
        # Small delay to be respectful to API
        time.sleep(1)
    
    # Summary of live scraping results
    print("🎯 LIVE SCRAPING SUMMARY")
    print("=" * 30)
    print(f"📍 Area: Bukit Bintang, Kuala Lumpur")
    print(f"🏪 Restaurants scraped: {len(scraped_data)}")
    print(f"⏰ Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    total_reviews = sum(len(r['liveReviews']) for r in scraped_data)
    print(f"📊 Total live reviews collected: {total_reviews}")
    print(f"⭐ Average rating of scraped restaurants: {sum(r['rating'] or 0 for r in scraped_data) / len(scraped_data):.1f}")
    print()
    
    # Show detailed results
    print("📋 DETAILED SCRAPING RESULTS:")
    print("=" * 35)
    
    for i, restaurant in enumerate(scraped_data, 1):
        print(f"\n🏪 {i}. {restaurant['name']}")
        print(f"   📍 {restaurant['address']}")
        print(f"   ⭐ {restaurant['rating']} ({restaurant['totalReviews']} total reviews)")
        print(f"   📞 {restaurant['phone'] or 'N/A'}")
        print(f"   🌐 {restaurant['website'] or 'N/A'}")
        print(f"   💬 Live reviews collected: {len(restaurant['liveReviews'])}")
        
        # Show one sample review per restaurant
        if restaurant['liveReviews']:
            sample_review = restaurant['liveReviews'][0]
            print(f"   📝 Sample review: \"{sample_review['text'][:100]}...\" - {sample_review['author']} ({sample_review['rating']}⭐)")
    
    # Save to JSON file for further analysis
    output_file = f"bukit_bintang_live_scrape_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            "scrapeInfo": {
                "area": "Bukit Bintang, Kuala Lumpur, Malaysia",
                "timestamp": datetime.now().isoformat(),
                "totalRestaurants": len(scraped_data),
                "totalReviews": total_reviews
            },
            "restaurants": scraped_data
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Data saved to: {output_file}")
    print("🚀 Live scraping completed successfully!")
    print()
    print("🤖 This data is now ready for:")
    print("   • AI fake review detection")
    print("   • Sentiment analysis")
    print("   • Restaurant recommendation algorithms")
    print("   • Market trend analysis")
    print("   • Consumer trust scoring")

if __name__ == "__main__":
    live_scrape_bukit_bintang()