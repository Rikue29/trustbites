"""
Google Maps Restaurant Review Scraper for AWS Lambda
Scrapes reviews from Google Maps and stores in DynamoDB
"""

import json
import boto3
import requests
import time
import uuid
from datetime import datetime
from urllib.parse import quote
import logging
from typing import Dict, List, Optional

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS clients
dynamodb = boto3.resource('dynamodb')
restaurants_table = dynamodb.Table('Restaurants')
reviews_table = dynamodb.Table('Reviews')

def lambda_handler(event, context):
    """
    Lambda handler for Google Maps scraping
    
    Expected event structure:
    {
        "restaurant_name": "Restaurant Name",
        "location": "City, Country",
        "max_reviews": 50
    }
    """
    
    try:
        # Parse input
        restaurant_name = event.get('restaurant_name')
        location = event.get('location', 'Kuala Lumpur, Malaysia')
        max_reviews = event.get('max_reviews', 50)
        
        if not restaurant_name:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'restaurant_name is required'})
            }
        
        logger.info(f"Scraping reviews for: {restaurant_name} in {location}")
        
        # Step 1: Search for restaurant and get Google Place ID
        restaurant_data = search_restaurant(restaurant_name, location)
        if not restaurant_data:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Restaurant not found'})
            }
        
        # Step 2: Scrape reviews from Google Maps
        reviews = scrape_google_reviews(restaurant_data['place_id'], max_reviews)
        
        # Step 3: Store restaurant data
        restaurant_id = store_restaurant(restaurant_data)
        
        # Step 4: Store reviews
        stored_reviews = []
        for review in reviews:
            review['restaurantId'] = restaurant_id
            review_id = store_review(review)
            stored_reviews.append(review_id)
        
        logger.info(f"Successfully scraped {len(stored_reviews)} reviews")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'restaurant_id': restaurant_id,
                'reviews_scraped': len(stored_reviews),
                'review_ids': stored_reviews
            })
        }
        
    except Exception as e:
        logger.error(f"Error in lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def search_restaurant(name: str, location: str) -> Optional[Dict]:
    """
    Search for restaurant using Google Places API
    Note: In production, you'd use the actual Google Places API
    For demo purposes, this simulates the search
    """
    
    # TODO: Replace with actual Google Places API call
    # For hackathon demo, we'll simulate restaurant data
    
    restaurant_id = f"rest_{uuid.uuid4().hex[:8]}"
    
    # Simulated restaurant data (replace with actual API call)
    return {
        'place_id': f"ChIJ{uuid.uuid4().hex[:16]}",
        'name': name,
        'address': f"123 Food Street, {location}",
        'location': location.split(',')[0].strip(),
        'cuisine': 'Malaysian',  # Could be detected from name/description
        'latitude': 3.1390 + (hash(name) % 100) * 0.001,  # Simulated coordinates
        'longitude': 101.6869 + (hash(name) % 100) * 0.001,
        'rating': 4.2,
        'total_reviews': 150
    }

def scrape_google_reviews(place_id: str, max_reviews: int) -> List[Dict]:
    """
    Scrape reviews from Google Maps
    Note: This is a simplified version for demo purposes
    In production, you'd need to handle:
    - Rate limiting
    - Dynamic content loading (Selenium/Playwright)
    - CAPTCHA handling
    - Proper error handling
    """
    
    reviews = []
    
    # Simulated review data for hackathon demo
    # In production, replace with actual scraping logic
    
    sample_reviews_en = [
        "The food here is absolutely amazing! Best nasi lemak I've ever had. Highly recommend!",
        "Decent place, food was okay but service could be better. Will try again.",
        "Terrible experience. Food was cold and staff was rude. Never coming back.",
        "Perfect restaurant! Outstanding service! Five stars! Best food ever! Amazing experience!",
        "Good value for money. Authentic flavors and reasonable portions.",
        "Not impressed. Overpriced and underwhelming taste. Expected better.",
        "Excellent food quality. Traditional recipes with fresh ingredients. Loved it!",
        "Average restaurant. Nothing special but not bad either. Clean environment."
    ]
    
    sample_reviews_ms = [
        "Makanan di sini sangat sedap! Nasi lemak terbaik yang pernah saya makan.",
        "Tempat yang baik, makanan sedap dan harga berpatutan. Akan datang lagi.",
        "Pengalaman yang mengecewakan. Makanan tidak fresh dan service lambat.",
        "Restoran terbaik! Makanan sangat hebat! Lima bintang! Highly recommended!",
        "Tempat yang selesa dengan makanan tradisional yang autentik."
    ]
    
    all_samples = sample_reviews_en + sample_reviews_ms
    
    for i in range(min(max_reviews, len(all_samples))):
        review_text = all_samples[i % len(all_samples)]
        
        # Add some variation to make it more realistic
        if i > len(all_samples):
            review_text += f" (Visit #{i})"
        
        review = {
            'authorName': f"User {i+1}",
            'reviewText': review_text,
            'rating': min(5, max(1, 3 + (hash(review_text) % 5) - 2)),  # Random rating 1-5
            'reviewDate': datetime.now().isoformat(),
            'language': 'ms' if any(word in review_text.lower() for word in ['makanan', 'sedap', 'tempat']) else 'en',
            'sourceUrl': f"https://maps.google.com/place/{place_id}/review_{i}"
        }
        
        reviews.append(review)
    
    return reviews

def store_restaurant(restaurant_data: Dict) -> str:
    """Store restaurant data in DynamoDB"""
    
    restaurant_id = f"rest_{uuid.uuid4().hex[:8]}"
    
    item = {
        'restaurantId': restaurant_id,
        'name': restaurant_data['name'],
        'address': restaurant_data['address'],
        'location': restaurant_data['location'],
        'cuisine': restaurant_data['cuisine'],
        'latitude': restaurant_data['latitude'],
        'longitude': restaurant_data['longitude'],
        'avgRating': restaurant_data['rating'],
        'totalReviews': restaurant_data['total_reviews'],
        'lastScraped': datetime.now().isoformat(),
        'googlePlaceId': restaurant_data['place_id']
    }
    
    restaurants_table.put_item(Item=item)
    logger.info(f"Stored restaurant: {restaurant_id}")
    
    return restaurant_id

def store_review(review_data: Dict) -> str:
    """Store review data in DynamoDB"""
    
    review_id = f"rev_{uuid.uuid4().hex[:12]}"
    
    item = {
        'reviewId': review_id,
        'restaurantId': review_data['restaurantId'],
        'authorName': review_data['authorName'],
        'reviewText': review_data['reviewText'],
        'rating': review_data['rating'],
        'reviewDate': review_data['reviewDate'],
        'scrapedAt': datetime.now().isoformat(),
        'language': review_data['language'],
        'isFake': 'pending',  # To be analyzed later
        'confidence': 0.0,
        'sentiment': 'unknown',
        'sourceUrl': review_data['sourceUrl']
    }
    
    reviews_table.put_item(Item=item)
    logger.info(f"Stored review: {review_id}")
    
    return review_id

# For local testing
if __name__ == "__main__":
    # Test event
    test_event = {
        "restaurant_name": "Village Park Restaurant",
        "location": "Petaling Jaya, Malaysia",
        "max_reviews": 10
    }
    
    # Mock context
    class MockContext:
        def __init__(self):
            self.function_name = "google-maps-scraper"
            self.memory_limit_in_mb = 512
            self.invoked_function_arn = "arn:aws:lambda:us-east-1:123456789012:function:test"
    
    result = lambda_handler(test_event, MockContext())
    print(json.dumps(result, indent=2))