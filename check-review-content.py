"""
Check actual review content in Malaysia DynamoDB region
"""

import os
import boto3
from boto3.dynamodb.conditions import Key

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv('.env.local')
except ImportError:
    print("Install python-dotenv: pip install python-dotenv")

# AWS Configuration - Malaysia region
AWS_REGION = os.environ.get('AWS_REGION', 'ap-southeast-5')
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
reviews_table = dynamodb.Table('Reviews')

def check_review_content():
    """Check what actual review content we have"""
    print(f"🔍 Checking review content in {AWS_REGION}...")
    
    try:
        # Scan reviews table to get recent reviews
        response = reviews_table.scan(Limit=10)
        reviews = response.get('Items', [])
        
        if not reviews:
            print("❌ No reviews found in database")
            return
        
        print(f"✅ Found {len(reviews)} reviews. Showing sample content:\n")
        
        # Show real vs demo data
        real_data_count = 0
        demo_data_count = 0
        
        for i, review in enumerate(reviews[:10], 1):
            data_source = review.get('dataSource', 'demo_data')
            author = review.get('authorName', 'Unknown')
            rating = review.get('rating', 0)
            text = review.get('reviewText', '')
            
            if data_source == 'google_places_api':
                real_data_count += 1
                source_indicator = "🌍 REAL"
            else:
                demo_data_count += 1
                source_indicator = "🎭 DEMO"
            
            print(f"{source_indicator} Review {i}:")
            print(f"   Author: {author}")
            print(f"   Rating: {rating}⭐")
            print(f"   Text: {text[:100]}{'...' if len(text) > 100 else ''}")
            print(f"   Full Length: {len(text)} characters")
            print()
        
        print(f"📊 Summary:")
        print(f"   Real Google Maps reviews: {real_data_count}")
        print(f"   Demo sample reviews: {demo_data_count}")
        print(f"   Total reviews: {len(reviews)}")
        
        # Show one full review example
        real_reviews = [r for r in reviews if r.get('dataSource') == 'google_places_api']
        if real_reviews:
            example = real_reviews[0]
            print(f"\n📝 Full Real Review Example:")
            print(f"Restaurant: {example.get('restaurantId', 'Unknown')}")
            print(f"Author: {example.get('authorName', 'Unknown')}")
            print(f"Rating: {example.get('rating', 0)}⭐")
            print(f"Language: {example.get('language', 'unknown')}")
            print(f"Full Text:")
            print(f'"{example.get("reviewText", "No text")}"')
            
    except Exception as e:
        print(f"❌ Error checking reviews: {e}")

if __name__ == "__main__":
    check_review_content()