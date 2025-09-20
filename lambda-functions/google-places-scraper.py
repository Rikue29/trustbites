"""
Google Places API Restaurant Review Scraper for AWS Lambda
Uses official Google Places API to get restaurant reviews
"""

import json
import boto3
import requests
import uuid
import os
from datetime import datetime
from typing import Dict, List, Optional
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS clients
dynamodb = boto3.resource('dynamodb')
restaurants_table = dynamodb.Table('Restaurants')
reviews_table = dynamodb.Table('Reviews')

# Google Places API configuration
GOOGLE_API_KEY = os.environ.get('GOOGLE_PLACES_API_KEY')
PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place"

def search_restaurant(restaurant_name: str, location: str = "Kuala Lumpur, Malaysia") -> Optional[Dict]:
    """
    Search for restaurant using Google Places API
    """
    if not GOOGLE_API_KEY:
        logger.error("Google Places API key not configured")
        return None
    
    # Text search for restaurant
    search_url = f"{PLACES_API_BASE}/textsearch/json"
    params = {
        'query': f"{restaurant_name} {location}",
        'key': GOOGLE_API_KEY,
        'type': 'restaurant'
    }
    
    try:
        response = requests.get(search_url, params=params)
        response.raise_for_status()
        data = response.json()
        
        if data['status'] == 'OK' and data['results']:
            return data['results'][0]  # Return first result
        else:
            logger.warning(f"No results found for {restaurant_name}")
            return None
            
    except Exception as e:
        logger.error(f"Error searching restaurant: {e}")
        return None

def get_restaurant_details(place_id: str) -> Optional[Dict]:
    """
    Get detailed information about restaurant including reviews
    """
    details_url = f"{PLACES_API_BASE}/details/json"
    params = {
        'place_id': place_id,
        'key': GOOGLE_API_KEY,
        'fields': 'name,formatted_address,geometry,rating,user_ratings_total,reviews,place_id,types,price_level'
    }
    
    try:
        response = requests.get(details_url, params=params)
        response.raise_for_status()
        data = response.json()
        
        if data['status'] == 'OK':
            return data['result']
        else:
            logger.error(f"Error getting place details: {data.get('status')}")
            return None
            
    except Exception as e:
        logger.error(f"Error getting restaurant details: {e}")
        return None

def store_restaurant(restaurant_data: Dict) -> str:
    """
    Store restaurant information in DynamoDB
    """
    restaurant_id = str(uuid.uuid4())
    
    # Extract location info
    geometry = restaurant_data.get('geometry', {}).get('location', {})
    
    restaurant_item = {
        'restaurantId': restaurant_id,
        'name': restaurant_data.get('name', ''),
        'address': restaurant_data.get('formatted_address', ''),
        'location': extract_city_from_address(restaurant_data.get('formatted_address', '')),
        'cuisine': extract_cuisine_type(restaurant_data.get('types', [])),
        'latitude': geometry.get('lat', 0),
        'longitude': geometry.get('lng', 0),
        'avgRating': restaurant_data.get('rating', 0),
        'totalReviews': restaurant_data.get('user_ratings_total', 0),
        'googlePlaceId': restaurant_data.get('place_id', ''),
        'priceLevel': restaurant_data.get('price_level', 0),
        'lastScraped': datetime.now().isoformat(),
        'createdAt': datetime.now().isoformat()
    }
    
    try:
        restaurants_table.put_item(Item=restaurant_item)
        logger.info(f"Stored restaurant: {restaurant_item['name']}")
        return restaurant_id
    except Exception as e:
        logger.error(f"Error storing restaurant: {e}")
        return None

def store_reviews(restaurant_id: str, reviews_data: List[Dict]):
    """
    Store reviews in DynamoDB
    """
    stored_count = 0
    
    for review in reviews_data:
        try:
            review_id = str(uuid.uuid4())
            
            review_item = {
                'reviewId': review_id,
                'restaurantId': restaurant_id,
                'authorName': review.get('author_name', 'Anonymous'),
                'reviewText': review.get('text', ''),
                'rating': review.get('rating', 0),
                'reviewDate': datetime.fromtimestamp(review.get('time', 0)).isoformat(),
                'scrapedAt': datetime.now().isoformat(),
                'language': review.get('language', 'en'),
                'isFake': 'pending',  # Will be analyzed by AI
                'confidence': 0.0,
                'sentiment': 'NEUTRAL',
                'sourceUrl': f"https://maps.google.com/maps/place/?q=place_id:{review.get('author_url', '')}",
                'googleReviewId': review.get('author_url', '').split('/')[-1] if review.get('author_url') else ''
            }
            
            reviews_table.put_item(Item=review_item)
            stored_count += 1
            
        except Exception as e:
            logger.error(f"Error storing review: {e}")
            continue
    
    logger.info(f"Stored {stored_count} reviews")
    return stored_count

def extract_city_from_address(address: str) -> str:
    """
    Extract city from formatted address
    """
    if not address:
        return "Unknown"
    
    # Common Malaysian cities
    malaysian_cities = [
        'Kuala Lumpur', 'Petaling Jaya', 'Shah Alam', 'Subang Jaya',
        'Penang', 'George Town', 'Johor Bahru', 'Malacca', 'Ipoh',
        'Kota Kinabalu', 'Kuching', 'Seremban', 'Klang'
    ]
    
    for city in malaysian_cities:
        if city.lower() in address.lower():
            return city
    
    # Default extraction - get second last part before country
    parts = address.split(', ')
    if len(parts) >= 2:
        return parts[-2]
    
    return "Kuala Lumpur"

def extract_cuisine_type(types: List[str]) -> str:
    """
    Extract cuisine type from Google Places types
    """
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
    
    for place_type in types:
        if place_type in cuisine_mapping:
            return cuisine_mapping[place_type]
    
    # Default for Malaysia
    if any(t in types for t in ['restaurant', 'food', 'meal_takeaway']):
        return 'Malaysian'
    
    return 'Restaurant'

def lambda_handler(event, context):
    """
    Lambda handler for Google Places API scraping
    
    Expected event structure:
    {
        "restaurant_name": "Restaurant Name",
        "location": "City, Malaysia",
        "include_reviews": true
    }
    """
    
    try:
        # Parse input
        restaurant_name = event.get('restaurant_name')
        location = event.get('location', 'Kuala Lumpur, Malaysia')
        include_reviews = event.get('include_reviews', True)
        
        if not restaurant_name:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'restaurant_name is required'})
            }
        
        if not GOOGLE_API_KEY:
            return {
                'statusCode': 500,
                'body': json.dumps({'error': 'Google Places API key not configured'})
            }
        
        logger.info(f"Scraping data for: {restaurant_name} in {location}")
        
        # Step 1: Search for restaurant
        restaurant_search = search_restaurant(restaurant_name, location)
        if not restaurant_search:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': f'Restaurant "{restaurant_name}" not found'})
            }
        
        # Step 2: Get detailed information
        place_id = restaurant_search['place_id']
        restaurant_details = get_restaurant_details(place_id)
        
        if not restaurant_details:
            return {
                'statusCode': 500,
                'body': json.dumps({'error': 'Failed to get restaurant details'})
            }
        
        # Step 3: Store restaurant
        restaurant_id = store_restaurant(restaurant_details)
        if not restaurant_id:
            return {
                'statusCode': 500,
                'body': json.dumps({'error': 'Failed to store restaurant'})
            }
        
        # Step 4: Store reviews if requested
        reviews_count = 0
        if include_reviews and 'reviews' in restaurant_details:
            reviews_count = store_reviews(restaurant_id, restaurant_details['reviews'])
        
        # Success response
        result = {
            'restaurantId': restaurant_id,
            'restaurantName': restaurant_details.get('name'),
            'address': restaurant_details.get('formatted_address'),
            'rating': restaurant_details.get('rating'),
            'totalReviews': restaurant_details.get('user_ratings_total', 0),
            'scrapedReviews': reviews_count,
            'googlePlaceId': place_id
        }
        
        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }
        
    except Exception as e:
        logger.error(f"Lambda execution error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

# For local testing
if __name__ == "__main__":
    # Test event
    test_event = {
        "restaurant_name": "Village Park Restaurant",
        "location": "Petaling Jaya, Malaysia",
        "include_reviews": True
    }
    
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2))