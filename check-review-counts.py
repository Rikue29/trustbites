"""
Check review count per restaurant from Google Maps scraping
"""

import os
import boto3
from collections import defaultdict

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv('.env.local')
except ImportError:
    pass

# AWS Configuration - Malaysia region
AWS_REGION = os.environ.get('AWS_REGION', 'ap-southeast-5')
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
reviews_table = dynamodb.Table('Reviews')
restaurants_table = dynamodb.Table('Restaurants')

def count_reviews_per_restaurant():
    """Count reviews scraped from each real restaurant"""
    print(f"📊 Review Count Analysis - {AWS_REGION}\n")
    
    try:
        # Get all restaurants
        restaurants_response = restaurants_table.scan()
        restaurants = {r['restaurantId']: r for r in restaurants_response.get('Items', [])}
        
        # Get all real reviews (from Google Places API)
        reviews_response = reviews_table.scan()
        all_reviews = reviews_response.get('Items', [])
        
        # Filter for real Google Maps reviews
        real_reviews = [r for r in all_reviews if r.get('dataSource') == 'google_places_api']
        
        # Count reviews per restaurant
        review_counts = defaultdict(int)
        restaurant_names = {}
        
        for review in real_reviews:
            restaurant_id = review.get('restaurantId')
            review_counts[restaurant_id] += 1
            
            # Get restaurant name
            if restaurant_id in restaurants:
                restaurant_names[restaurant_id] = restaurants[restaurant_id].get('name', 'Unknown')
        
        print("🌍 REAL GOOGLE MAPS REVIEWS PER RESTAURANT:")
        print("=" * 60)
        
        total_real_reviews = 0
        restaurant_count = 0
        
        for restaurant_id, count in review_counts.items():
            name = restaurant_names.get(restaurant_id, 'Unknown Restaurant')
            print(f"📍 {name}")
            print(f"   Reviews scraped: {count}")
            total_real_reviews += count
            restaurant_count += 1
            print()
        
        print("=" * 60)
        print(f"📊 SUMMARY:")
        print(f"   Real restaurants scraped: {restaurant_count}")
        print(f"   Total real reviews: {total_real_reviews}")
        print(f"   Average reviews per restaurant: {total_real_reviews/restaurant_count:.1f}")
        
        # Also count demo data for comparison
        demo_reviews = [r for r in all_reviews if r.get('dataSource') != 'google_places_api']
        print(f"   Demo reviews (for comparison): {len(demo_reviews)}")
        print(f"   Total reviews in database: {len(all_reviews)}")
        
        # Show Google Places API limitation
        print(f"\n💡 NOTE: Google Places API returns max 5 reviews per restaurant")
        print(f"   This is a Google API limitation, not our scraper limitation")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    count_reviews_per_restaurant()