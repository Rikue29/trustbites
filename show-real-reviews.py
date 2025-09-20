"""
Show all real Google Maps reviews with full content
"""

import os
import boto3

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

def show_all_real_reviews():
    """Show all real Google Maps reviews with full content"""
    print(f"🌍 All Real Google Maps Reviews in {AWS_REGION}:\n")
    
    try:
        # Scan all reviews
        response = reviews_table.scan()
        all_reviews = response.get('Items', [])
        
        # Filter for real Google Maps data
        real_reviews = [r for r in all_reviews if r.get('dataSource') == 'google_places_api']
        
        if not real_reviews:
            print("❌ No real Google Maps reviews found")
            return
        
        print(f"✅ Found {len(real_reviews)} real reviews from Google Maps:\n")
        
        for i, review in enumerate(real_reviews, 1):
            author = review.get('authorName', 'Unknown')
            rating = review.get('rating', 0)
            text = review.get('reviewText', '')
            language = review.get('language', 'unknown')
            date = review.get('reviewDate', 'Unknown date')
            
            print(f"🌍 Real Review #{i}:")
            print(f"   👤 Author: {author}")
            print(f"   ⭐ Rating: {rating}/5")
            print(f"   🗓️ Date: {date[:10]}")  # Show just the date part
            print(f"   🌐 Language: {language}")
            print(f"   📝 Full Review Text:")
            print(f'   "{text}"')
            print("-" * 80)
            print()
        
        print(f"📊 Summary: {len(real_reviews)} authentic customer reviews from Google Maps")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    show_all_real_reviews()