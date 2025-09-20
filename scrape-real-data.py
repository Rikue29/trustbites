"""
Real Google Maps Data Scraper for TrustBites
Adds real restaurant data from Google Places API to existing DynamoDB tables
"""

import os
import json
import requests
import uuid
from datetime import datetime
from typing import Dict, List, Optional
import boto3
from boto3.dynamodb.conditions import Key
from decimal import Decimal

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv('.env.local')
except ImportError:
    print("Install python-dotenv: pip install python-dotenv")

# AWS Configuration
AWS_REGION = os.environ.get('AWS_REGION', 'ap-southeast-5')
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
restaurants_table = dynamodb.Table('Restaurants')
reviews_table = dynamodb.Table('Reviews')

# Google Places API configuration
GOOGLE_API_KEY = os.environ.get('GOOGLE_PLACES_API_KEY')
PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place"

def search_restaurant(restaurant_name: str, location: str = "Malaysia") -> Optional[Dict]:
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
            print(f"✅ Restaurant: {result.get('name')} - {result.get('rating', 0)}/5 - {len(result.get('reviews', []))} reviews available")
            return result
        else:
            print(f"❌ Error getting place details: {data.get('status')}")
            return None
            
    except Exception as e:
        print(f"❌ Error getting restaurant details: {e}")
        return None

def extract_city_from_address(address: str) -> str:
    """Extract city from formatted address"""
    if not address:
        return "Unknown"
    
    # Malaysian cities and states
    malaysian_locations = [
        'Kuala Lumpur', 'Petaling Jaya', 'Shah Alam', 'Subang Jaya',
        'Penang', 'George Town', 'Johor Bahru', 'Malacca', 'Ipoh',
        'Kota Kinabalu', 'Kuching', 'Seremban', 'Klang', 'Kajang',
        'Ampang', 'Cheras', 'Puchong', 'Setapak', 'Mont Kiara',
        'Bangsar', 'KLCC', 'Bukit Bintang', 'Damansara'
    ]
    
    for location in malaysian_locations:
        if location.lower() in address.lower():
            return location
    
    # Extract from address parts
    parts = address.split(', ')
    if len(parts) >= 2:
        # Try to find Malaysian state/city
        for part in parts:
            if any(state in part for state in ['Selangor', 'Kuala Lumpur', 'Penang', 'Johor']):
                return part.strip()
    
    return "Kuala Lumpur"

def extract_cuisine_type(types: List[str], name: str = "") -> str:
    """Extract cuisine type from Google Places types and restaurant name"""
    cuisine_mapping = {
        'chinese_restaurant': 'Chinese',
        'japanese_restaurant': 'Japanese', 
        'indian_restaurant': 'Indian',
        'italian_restaurant': 'Italian',
        'thai_restaurant': 'Thai',
        'korean_restaurant': 'Korean',
        'vietnamese_restaurant': 'Vietnamese',
        'halal_restaurant': 'Halal',
        'seafood_restaurant': 'Seafood',
        'bakery': 'Bakery',
        'cafe': 'Cafe'
    }
    
    # Check Google types first
    for place_type in types:
        if place_type in cuisine_mapping:
            return cuisine_mapping[place_type]
    
    # Check restaurant name for cuisine hints
    name_lower = name.lower()
    if any(word in name_lower for word in ['chinese', 'china', 'dim sum']):
        return 'Chinese'
    elif any(word in name_lower for word in ['indian', 'curry', 'tandoor']):
        return 'Indian'
    elif any(word in name_lower for word in ['thai', 'thailand']):
        return 'Thai'
    elif any(word in name_lower for word in ['japanese', 'sushi', 'ramen']):
        return 'Japanese'
    elif any(word in name_lower for word in ['korean', 'bbq']):
        return 'Korean'
    elif any(word in name_lower for word in ['halal', 'muslim']):
        return 'Halal'
    
    # Default for Malaysia
    return 'Malaysian'

def store_restaurant(restaurant_data: Dict) -> str:
    """Store restaurant information in DynamoDB"""
    restaurant_id = str(uuid.uuid4())
    
    # Extract location info
    geometry = restaurant_data.get('geometry', {}).get('location', {})
    
    restaurant_item = {
        'restaurantId': restaurant_id,
        'name': restaurant_data.get('name', ''),
        'address': restaurant_data.get('formatted_address', ''),
        'location': extract_city_from_address(restaurant_data.get('formatted_address', '')),
        'cuisine': extract_cuisine_type(restaurant_data.get('types', []), restaurant_data.get('name', '')),
        'latitude': Decimal(str(geometry.get('lat', 0))),
        'longitude': Decimal(str(geometry.get('lng', 0))),
        'avgRating': Decimal(str(restaurant_data.get('rating', 0))),
        'totalReviews': int(restaurant_data.get('user_ratings_total', 0)),
        'googlePlaceId': restaurant_data.get('place_id', ''),
        'priceLevel': int(restaurant_data.get('price_level', 0)),
        'lastScraped': datetime.now().isoformat(),
        'createdAt': datetime.now().isoformat(),
        'dataSource': 'google_places_api'  # Mark as real data
    }
    
    try:
        restaurants_table.put_item(Item=restaurant_item)
        print(f"📍 Stored restaurant: {restaurant_item['name']} ({restaurant_item['location']})")
        return restaurant_id
    except Exception as e:
        print(f"❌ Error storing restaurant: {e}")
        return None

def detect_language(text: str) -> str:
    """Simple language detection for English vs Bahasa Melayu"""
    # Bahasa Melayu common words
    malay_words = [
        'yang', 'dan', 'ini', 'itu', 'dengan', 'untuk', 'dari', 'pada', 'di', 'ke',
        'sangat', 'bagus', 'sedap', 'enak', 'makanan', 'restoran', 'tempat', 'saya',
        'kami', 'mereka', 'tidak', 'ada', 'sudah', 'akan', 'boleh', 'makan', 'minum'
    ]
    
    text_lower = text.lower()
    malay_count = sum(1 for word in malay_words if word in text_lower)
    
    # If more than 2 Malay words found, consider it Bahasa Melayu
    return 'ms' if malay_count > 2 else 'en'

def store_reviews(restaurant_id: str, reviews_data: List[Dict]) -> int:
    """Store reviews in DynamoDB"""
    stored_count = 0
    
    for review in reviews_data:
        try:
            review_id = str(uuid.uuid4())
            review_text = review.get('text', '')
            
            review_item = {
                'reviewId': review_id,
                'restaurantId': restaurant_id,
                'authorName': review.get('author_name', 'Anonymous'),
                'reviewText': review_text,
                'rating': int(review.get('rating', 0)),
                'reviewDate': datetime.fromtimestamp(review.get('time', 0)).isoformat(),
                'scrapedAt': datetime.now().isoformat(),
                'language': detect_language(review_text),
                'isFake': 'pending',  # Will be analyzed by AI
                'confidence': Decimal('0.0'),
                'sentiment': 'NEUTRAL',
                'sourceUrl': f"https://maps.google.com/?q=place_id:{review.get('place_id', '')}",
                'dataSource': 'google_places_api'  # Mark as real data
            }
            
            reviews_table.put_item(Item=review_item)
            stored_count += 1
            print(f"📝 Added review: {review.get('author_name')} - {review.get('rating')}⭐")
            
        except Exception as e:
            print(f"❌ Error storing review: {e}")
            continue
    
    return stored_count

def scrape_and_add_restaurants():
    """Main function to scrape and add real restaurant data"""
    print("🏗️ Adding real Google Maps data to TrustBites DynamoDB...")
    print(f"🌍 Region: {AWS_REGION}")
    print(f"🔑 Google API Key: {GOOGLE_API_KEY[:10]}..." if GOOGLE_API_KEY else "❌ No API Key")
    print("\n" + "="*60)
    
    if not GOOGLE_API_KEY:
        print("❌ Google Places API key not configured")
        return
    
    # Real Malaysian restaurants to scrape
    restaurants_to_scrape = [
        {"name": "Mamak Stall Kayu Nasi Kandar", "location": "Penang, Malaysia"},
        {"name": "Restoran Kapitan", "location": "Penang, Malaysia"},
        {"name": "Kim Lian Kee", "location": "Kuala Lumpur, Malaysia"},
        {"name": "Wong Ah Wah", "location": "Kuala Lumpur, Malaysia"},
        {"name": "Restoran Soong Kee", "location": "Kuala Lumpur, Malaysia"},
        {"name": "Nancy's Kitchen", "location": "Penang, Malaysia"},
        {"name": "Restoran Oversea", "location": "Kuala Lumpur, Malaysia"}
    ]
    
    total_restaurants = 0
    total_reviews = 0
    
    for restaurant_info in restaurants_to_scrape:
        print(f"\n🔄 Processing: {restaurant_info['name']}")
        print("-" * 40)
        
        try:
            # Step 1: Search for restaurant
            restaurant_search = search_restaurant(
                restaurant_info['name'], 
                restaurant_info['location']
            )
            
            if not restaurant_search:
                continue
            
            # Step 2: Get detailed information
            place_id = restaurant_search['place_id']
            restaurant_details = get_restaurant_details(place_id)
            
            if not restaurant_details:
                continue
            
            # Step 3: Store restaurant
            restaurant_id = store_restaurant(restaurant_details)
            if not restaurant_id:
                continue
            
            total_restaurants += 1
            
            # Step 4: Store reviews
            if 'reviews' in restaurant_details:
                reviews_count = store_reviews(restaurant_id, restaurant_details['reviews'])
                total_reviews += reviews_count
                print(f"✅ Added {reviews_count} reviews")
            
            print(f"✅ {restaurant_info['name']} completed!")
            
        except Exception as e:
            print(f"❌ Error processing {restaurant_info['name']}: {e}")
            continue
    
    print("\n" + "="*60)
    print("🎉 Real data scraping completed!")
    print(f"📍 Added {total_restaurants} real restaurants")
    print(f"📝 Added {total_reviews} real reviews")
    print(f"🔗 Data source: Google Places API")
    print(f"🗄️ Region: {AWS_REGION} (Malaysia)")
    
    print("\n📋 You now have:")
    print("• Demo data (sample restaurants and reviews)")  
    print("• Real data (scraped from Google Maps)")
    print("• Perfect for hackathon demonstration!")

if __name__ == "__main__":
    scrape_and_add_restaurants()