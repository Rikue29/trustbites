"""
Test global restaurant scraping capabilities
"""

import requests
import json

GOOGLE_API_KEY = "AIzaSyB_cVKxLR2idCaCFLdDavry-pDF6BhNgiQ"
PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place"

def test_global_scraping():
    """Test scraping restaurants from different countries"""
    
    print("🌍 TrustBites Global Restaurant Scraping Test")
    print("============================================\n")
    
    test_locations = [
        {"name": "Din Tai Fung", "location": "Singapore", "flag": "🇸🇬"},
        {"name": "Ichiran Ramen", "location": "Tokyo, Japan", "flag": "🇯🇵"},
        {"name": "Katz's Delicatessen", "location": "New York, USA", "flag": "🇺🇸"},
        {"name": "Dishoom", "location": "London, UK", "flag": "🇬🇧"},
    ]
    
    scraped_data = []
    
    for test in test_locations:
        print(f"{test['flag']} Testing: {test['name']} in {test['location']}")
        print("-" * 50)
        
        # Search for restaurant
        search_url = f"{PLACES_API_BASE}/textsearch/json"
        search_params = {
            'query': f"{test['name']} {test['location']}",
            'key': GOOGLE_API_KEY,
            'type': 'restaurant'
        }
        
        try:
            response = requests.get(search_url, params=search_params)
            
            if response.status_code == 200:
                data = response.json()
                
                if data['status'] == 'OK' and data['results']:
                    restaurant = data['results'][0]
                    
                    print(f"✅ Found: {restaurant['name']}")
                    print(f"📍 Address: {restaurant.get('formatted_address', 'N/A')}")
                    print(f"⭐ Rating: {restaurant.get('rating', 'N/A')}")
                    print(f"💰 Price Level: {restaurant.get('price_level', 'N/A')}")
                    
                    scraped_data.append({
                        "country": test['location'],
                        "name": restaurant['name'],
                        "rating": restaurant.get('rating'),
                        "address": restaurant.get('formatted_address'),
                        "placeId": restaurant['place_id']
                    })
                    
                else:
                    print(f"❌ Not found. Status: {data['status']}")
                    
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            
        print()
    
    print("🌍 Global Scraping Summary:")
    print("=" * 30)
    for data in scraped_data:
        print(f"{data['country']}: {data['name']} (⭐{data['rating']})")
    
    print(f"\n✅ Successfully scraped {len(scraped_data)} restaurants globally!")
    print("🚀 TrustBites can scrape restaurant data from anywhere in the world!")

if __name__ == "__main__":
    test_global_scraping()