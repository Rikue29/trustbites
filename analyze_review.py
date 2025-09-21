#!/usr/bin/env python3
"""
TrustBites Review Analyzer - Terminal Tool
==========================================
Simple command-line tool to analyze restaurant reviews for fake detection
using AWS Bedrock Llama 3 70B model.

Usage:
  python analyze_review.py
  python analyze_review.py --review "Your review text here"
  python analyze_review.py --file reviews.txt
"""

import json
import sys
import argparse
import boto3
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

# Initialize Bedrock client
bedrock_client = boto3.client(
    'bedrock-runtime',
    region_name=os.getenv('BEDROCK_REGION', 'us-east-1'),
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
)

MODEL_ID = "meta.llama3-70b-instruct-v1:0"

def create_analysis_prompt(review_text, rating=None, author_name=None, restaurant_name=None):
    """Create a comprehensive prompt for fake review detection"""
    
    prompt = f"""You are an expert at detecting fake restaurant reviews. Analyze the following review and determine if it's genuine or fake.

Review Details:
- Text: "{review_text}"
- Rating: {rating or "Unknown"}/5 stars
- Author: {author_name or "Anonymous"}
- Restaurant: {restaurant_name or "Unknown"}

Analyze for these fake review indicators:
1. **Generic Language**: Overly generic praise/complaints
2. **Excessive Emotion**: Unrealistic superlatives or extreme negativity
3. **Repetitive Patterns**: Similar phrasing to common fake reviews
4. **Inconsistent Details**: Contradictory information
5. **Language Quality**: Unnatural language flow
6. **Specificity**: Lack of specific details about food/service

Provide your analysis in this EXACT JSON format:
{{
  "isFake": true/false,
  "confidence": 0.0-1.0,
  "reasons": ["reason1", "reason2"],
  "sentiment": "positive/negative/neutral",
  "languageConfidence": 0.0-1.0,
  "explanation": "Brief explanation of your decision"
}}

Be thorough but concise. Consider cultural context for Malaysian/English reviews."""
    
    return prompt

def analyze_review_with_bedrock(review_text, rating=None, author_name=None, restaurant_name=None):
    """Analyze a review using AWS Bedrock Llama 3 70B model"""
    
    try:
        prompt = create_analysis_prompt(review_text, rating, author_name, restaurant_name)
        
        # Prepare request body for Llama 3
        request_body = {
            "prompt": f"<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\n{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n",
            "max_gen_len": 1000,
            "temperature": 0.1,
            "top_p": 0.9
        }
        
        print("🤖 Analyzing with AWS Bedrock Llama 3 70B...")
        
        # Invoke the model
        response = bedrock_client.invoke_model(
            modelId=MODEL_ID,
            contentType="application/json",
            accept="application/json",
            body=json.dumps(request_body)
        )
        
        # Parse response
        response_body = json.loads(response['body'].read())
        ai_response = response_body.get('generation', '')
        
        # Extract JSON from AI response
        json_start = ai_response.find('{')
        json_end = ai_response.rfind('}') + 1
        
        if json_start == -1 or json_end == 0:
            raise ValueError("Could not find JSON in AI response")
        
        json_str = ai_response[json_start:json_end]
        analysis = json.loads(json_str)
        
        return {
            'success': True,
            'analysis': analysis,
            'model_used': MODEL_ID,
            'raw_response': ai_response
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'model_used': MODEL_ID
        }

def print_analysis_result(result, review_text):
    """Print the analysis result in a nice format"""
    
    print("\n" + "="*60)
    print("🍽️  TRUSTBITES REVIEW ANALYSIS RESULT")
    print("="*60)
    
    print(f"\n📝 Review: \"{review_text[:100]}{'...' if len(review_text) > 100 else ''}\"")
    print(f"🤖 Model: {result['model_used']}")
    
    if result['success']:
        analysis = result['analysis']
        
        # Main result
        fake_status = "🚩 FAKE" if analysis['isFake'] else "✅ GENUINE"
        confidence = analysis['confidence'] * 100
        
        print(f"\n🎯 Result: {fake_status}")
        print(f"📊 Confidence: {confidence:.1f}%")
        print(f"😊 Sentiment: {analysis['sentiment'].upper()}")
        print(f"🗣️  Language Confidence: {analysis.get('languageConfidence', 0) * 100:.1f}%")
        
        # Reasons (if any)
        if analysis.get('reasons') and len(analysis['reasons']) > 0:
            print(f"\n⚠️  Detection Reasons:")
            for reason in analysis['reasons']:
                print(f"   • {reason.replace('_', ' ').title()}")
        
        # Explanation
        if analysis.get('explanation'):
            print(f"\n💭 Explanation: {analysis['explanation']}")
        
        # Overall assessment
        print(f"\n🎭 Assessment:")
        if analysis['isFake']:
            print("   This review shows signs of being artificially generated or fake.")
        else:
            print("   This review appears to be a genuine customer experience.")
        
    else:
        print(f"\n❌ Analysis failed: {result['error']}")
    
    print("="*60)

def interactive_mode():
    """Interactive mode for entering reviews"""
    
    print("🍽️  TrustBites Review Analyzer")
    print("="*40)
    print("Enter restaurant review details (press Enter for defaults)")
    print()
    
    # Get review details
    review_text = input("📝 Review text: ").strip()
    if not review_text:
        print("❌ Review text is required!")
        return
    
    rating = input("⭐ Rating (1-5): ").strip()
    rating = int(rating) if rating.isdigit() and 1 <= int(rating) <= 5 else None
    
    author_name = input("👤 Author name (optional): ").strip() or None
    restaurant_name = input("🏪 Restaurant name (optional): ").strip() or None
    
    # Analyze the review
    result = analyze_review_with_bedrock(review_text, rating, author_name, restaurant_name)
    print_analysis_result(result, review_text)

def analyze_from_file(filename):
    """Analyze reviews from a text file"""
    
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            reviews = [line.strip() for line in f if line.strip()]
        
        print(f"📁 Found {len(reviews)} reviews in {filename}")
        
        for i, review in enumerate(reviews, 1):
            print(f"\n--- Review {i}/{len(reviews)} ---")
            result = analyze_review_with_bedrock(review)
            print_analysis_result(result, review)
            
            if i < len(reviews):
                input("\nPress Enter to analyze next review...")
                
    except FileNotFoundError:
        print(f"❌ File not found: {filename}")
    except Exception as e:
        print(f"❌ Error reading file: {e}")

def main():
    """Main function with command line argument parsing"""
    
    parser = argparse.ArgumentParser(
        description="Analyze restaurant reviews for fake detection using AWS Bedrock",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python analyze_review.py
  python analyze_review.py --review "Amazing food, best restaurant ever!"
  python analyze_review.py --file reviews.txt
  python analyze_review.py --review "Great service" --rating 5 --author "John" --restaurant "Nasi Lemak Place"
        """
    )
    
    parser.add_argument('--review', '-r', help='Review text to analyze')
    parser.add_argument('--rating', type=int, choices=range(1, 6), help='Rating (1-5)')
    parser.add_argument('--author', help='Author name')
    parser.add_argument('--restaurant', help='Restaurant name')
    parser.add_argument('--file', '-f', help='Analyze reviews from text file')
    
    args = parser.parse_args()
    
    # Check AWS credentials
    if not os.getenv('AWS_ACCESS_KEY_ID') or not os.getenv('AWS_SECRET_ACCESS_KEY'):
        print("❌ AWS credentials not found!")
        print("Make sure .env.local file exists with AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY")
        sys.exit(1)
    
    if args.file:
        # Analyze from file
        analyze_from_file(args.file)
    elif args.review:
        # Analyze single review from command line
        result = analyze_review_with_bedrock(args.review, args.rating, args.author, args.restaurant)
        print_analysis_result(result, args.review)
    else:
        # Interactive mode
        interactive_mode()

if __name__ == "__main__":
    main()
