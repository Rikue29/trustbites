"""
Integration Checklist for TrustBites AI Model
Run this to verify everything is set up correctly for your friend's AI model
"""

import os
import boto3
import json
from datetime import datetime

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv('.env.local')
except ImportError:
    pass

# AWS Configuration
AWS_REGION = os.environ.get('AWS_REGION', 'ap-southeast-5')
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)

def run_integration_checklist():
    """Run complete integration checklist"""
    print("🔍 TrustBites AI Integration Checklist")
    print("=" * 50)
    
    checks_passed = 0
    total_checks = 7
    
    # Check 1: Database connectivity
    try:
        tables = list(dynamodb.tables.all())
        table_names = [table.name for table in tables]
        required_tables = ['Restaurants', 'Reviews', 'AnalysisResults']
        
        if all(table in table_names for table in required_tables):
            print("✅ 1. Database tables accessible")
            checks_passed += 1
        else:
            print(f"❌ 1. Missing tables: {set(required_tables) - set(table_names)}")
    except Exception as e:
        print(f"❌ 1. Database connection failed: {e}")
    
    # Check 2: Reviews table structure
    try:
        reviews_table = dynamodb.Table('Reviews')
        response = reviews_table.scan(Limit=1)
        
        if response['Items']:
            sample_review = response['Items'][0]
            required_fields = ['reviewId', 'reviewText', 'rating', 'language', 'authorName']
            
            if all(field in sample_review for field in required_fields):
                print("✅ 2. Review data structure correct")
                checks_passed += 1
            else:
                missing_fields = set(required_fields) - set(sample_review.keys())
                print(f"❌ 2. Missing review fields: {missing_fields}")
        else:
            print("❌ 2. No review data found")
    except Exception as e:
        print(f"❌ 2. Review structure check failed: {e}")
    
    # Check 3: Pending reviews available
    try:
        reviews_table = dynamodb.Table('Reviews')
        response = reviews_table.scan(
            FilterExpression="isFake = :pending",
            ExpressionAttributeValues={":pending": "pending"}
        )
        
        pending_count = len(response['Items'])
        if pending_count > 0:
            print(f"✅ 3. Found {pending_count} reviews pending AI analysis")
            checks_passed += 1
        else:
            print("❌ 3. No pending reviews found for AI analysis")
    except Exception as e:
        print(f"❌ 3. Pending reviews check failed: {e}")
    
    # Check 4: Data format validation
    try:
        reviews_table = dynamodb.Table('Reviews')
        response = reviews_table.scan(Limit=5)
        
        valid_format = True
        for item in response['Items'][:3]:
            # Check rating is numeric
            if not isinstance(item.get('rating'), (int, float)):
                valid_format = False
                break
            
            # Check language is string
            if not isinstance(item.get('language', 'en'), str):
                valid_format = False
                break
        
        if valid_format:
            print("✅ 4. Data formats compatible with AI model")
            checks_passed += 1
        else:
            print("❌ 4. Data format issues detected")
    except Exception as e:
        print(f"❌ 4. Data format validation failed: {e}")
    
    # Check 5: Language distribution
    try:
        reviews_table = dynamodb.Table('Reviews')
        response = reviews_table.scan()
        
        languages = {}
        for item in response['Items']:
            lang = item.get('language', 'unknown')
            languages[lang] = languages.get(lang, 0) + 1
        
        if len(languages) > 1:
            print(f"✅ 5. Multi-language support: {dict(languages)}")
            checks_passed += 1
        else:
            print(f"⚠️  5. Limited language variety: {dict(languages)}")
    except Exception as e:
        print(f"❌ 5. Language check failed: {e}")
    
    # Check 6: Sample data export
    try:
        reviews_table = dynamodb.Table('Reviews')
        response = reviews_table.scan(
            FilterExpression="isFake = :pending",
            ExpressionAttributeValues={":pending": "pending"},
            Limit=3
        )
        
        sample_data = []
        for item in response['Items']:
            sample_data.append({
                "reviewId": item['reviewId'],
                "reviewText": item['reviewText'],
                "rating": int(item['rating']),
                "language": item.get('language', 'en'),
                "authorName": item['authorName'],
                "reviewDate": item.get('reviewDate', datetime.now().isoformat()),
                "restaurantId": item['restaurantId']
            })
        
        if sample_data:
            print("✅ 6. Sample data export ready")
            print(f"   Sample review: \"{sample_data[0]['reviewText'][:50]}...\"")
            checks_passed += 1
        else:
            print("❌ 6. No sample data available")
    except Exception as e:
        print(f"❌ 6. Sample data export failed: {e}")
    
    # Check 7: Integration readiness
    integration_files = [
        'AI_INTEGRATION_GUIDE.md',
        'src/ai-integration-complete.ts'
    ]
    
    files_exist = 0
    for file_path in integration_files:
        if os.path.exists(file_path):
            files_exist += 1
    
    if files_exist == len(integration_files):
        print("✅ 7. Integration documentation complete")
        checks_passed += 1
    else:
        print(f"❌ 7. Missing integration files: {len(integration_files) - files_exist}")
    
    # Summary
    print("\n" + "=" * 50)
    print(f"🎯 Integration Readiness: {checks_passed}/{total_checks} checks passed")
    
    if checks_passed >= 6:
        print("🎉 READY FOR AI INTEGRATION!")
        print("\n📋 Next steps for your AI teammate:")
        print("   1. Review AI_INTEGRATION_GUIDE.md")
        print("   2. Test with sample data structure")
        print("   3. Replace mock AI function with real model")
        print("   4. Run integration tests")
        print("   5. Prepare hackathon demo")
    elif checks_passed >= 4:
        print("⚠️  MOSTLY READY - Some issues to fix")
        print("   Review failed checks above")
    else:
        print("❌ NOT READY - Major issues detected")
        print("   Fix critical issues before AI integration")
    
    # Export sample data for AI teammate
    if checks_passed >= 4:
        print(f"\n📁 Sample data for AI model testing:")
        try:
            reviews_table = dynamodb.Table('Reviews')
            response = reviews_table.scan(
                FilterExpression="isFake = :pending",
                ExpressionAttributeValues={":pending": "pending"},
                Limit=5
            )
            
            print("```json")
            for i, item in enumerate(response['Items'][:3], 1):
                sample = {
                    "reviewId": item['reviewId'],
                    "reviewText": item['reviewText'][:100] + "...",
                    "rating": int(item['rating']),
                    "language": item.get('language', 'en'),
                    "authorName": item['authorName']
                }
                print(f"// Sample {i}")
                print(json.dumps(sample, indent=2))
                if i < 3:
                    print(",")
            print("```")
        except:
            pass

if __name__ == "__main__":
    run_integration_checklist()