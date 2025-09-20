"""
Amazon Comprehend Analysis Lambda for TrustBites
Analyzes reviews for sentiment, language, and fake detection
"""

import json
import boto3
import logging
from datetime import datetime
from typing import Dict, List
import re

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS clients
comprehend = boto3.client('comprehend')
dynamodb = boto3.resource('dynamodb')
reviews_table = dynamodb.Table('Reviews')

def lambda_handler(event, context):
    """
    Lambda handler for review analysis using Amazon Comprehend
    
    Expected event structure:
    {
        "review_ids": ["rev_123", "rev_456"],  # List of review IDs to analyze
        # OR
        "restaurant_id": "rest_123",           # Analyze all pending reviews for restaurant
        # OR  
        "analyze_all_pending": true            # Analyze all pending reviews
    }
    """
    
    try:
        # Get reviews to analyze
        if 'review_ids' in event:
            reviews = get_reviews_by_ids(event['review_ids'])
        elif 'restaurant_id' in event:
            reviews = get_pending_reviews_by_restaurant(event['restaurant_id'])
        elif event.get('analyze_all_pending'):
            reviews = get_all_pending_reviews()
        else:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Must specify review_ids, restaurant_id, or analyze_all_pending'})
            }
        
        if not reviews:
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'success': True,
                    'message': 'No reviews to analyze',
                    'analyzed_count': 0
                })
            }
        
        logger.info(f"Analyzing {len(reviews)} reviews")
        
        # Analyze each review
        analyzed_count = 0
        for review in reviews:
            try:
                analysis_result = analyze_review_with_comprehend(review['reviewText'], review['language'])
                
                # Update review with analysis results
                update_review_analysis(review['reviewId'], analysis_result)
                analyzed_count += 1
                
            except Exception as e:
                logger.error(f"Error analyzing review {review['reviewId']}: {str(e)}")
                continue
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'analyzed_count': analyzed_count,
                'total_reviews': len(reviews)
            })
        }
        
    except Exception as e:
        logger.error(f"Error in lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def get_reviews_by_ids(review_ids: List[str]) -> List[Dict]:
    """Get specific reviews by their IDs"""
    reviews = []
    
    for review_id in review_ids:
        try:
            response = reviews_table.get_item(Key={'reviewId': review_id})
            if 'Item' in response:
                reviews.append(response['Item'])
        except Exception as e:
            logger.error(f"Error getting review {review_id}: {str(e)}")
    
    return reviews

def get_pending_reviews_by_restaurant(restaurant_id: str) -> List[Dict]:
    """Get all pending reviews for a specific restaurant"""
    try:
        response = reviews_table.query(
            IndexName='RestaurantIndex',
            KeyConditionExpression='restaurantId = :rid',
            FilterExpression='isFake = :pending',
            ExpressionAttributeValues={
                ':rid': restaurant_id,
                ':pending': 'pending'
            }
        )
        return response.get('Items', [])
    except Exception as e:
        logger.error(f"Error getting pending reviews for restaurant {restaurant_id}: {str(e)}")
        return []

def get_all_pending_reviews(limit: int = 100) -> List[Dict]:
    """Get all pending reviews (limited for Lambda execution time)"""
    try:
        response = reviews_table.scan(
            FilterExpression='isFake = :pending',
            ExpressionAttributeValues={':pending': 'pending'},
            Limit=limit
        )
        return response.get('Items', [])
    except Exception as e:
        logger.error(f"Error getting all pending reviews: {str(e)}")
        return []

def analyze_review_with_comprehend(review_text: str, detected_language: str = None) -> Dict:
    """
    Analyze review using Amazon Comprehend
    Returns comprehensive analysis including fake detection
    """
    
    try:
        # Step 1: Detect language if not provided
        if not detected_language or detected_language == 'unknown':
            lang_response = comprehend.detect_dominant_language(Text=review_text)
            detected_language = lang_response['Languages'][0]['LanguageCode'] if lang_response['Languages'] else 'en'
        
        # Ensure language is supported by Comprehend
        supported_languages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ar', 'hi', 'ja', 'ko', 'zh', 'zh-TW']
        if detected_language not in supported_languages:
            detected_language = 'en'  # Default to English
        
        # Step 2: Sentiment Analysis
        sentiment_response = comprehend.detect_sentiment(
            Text=review_text,
            LanguageCode=detected_language
        )
        
        # Step 3: Key Phrases Extraction
        keyphrases_response = comprehend.detect_key_phrases(
            Text=review_text,
            LanguageCode=detected_language
        )
        
        # Step 4: Entity Detection
        entities_response = comprehend.detect_entities(
            Text=review_text,
            LanguageCode=detected_language
        )
        
        # Step 5: Advanced Fake Detection Algorithm
        fake_analysis = detect_fake_review_advanced(
            review_text, 
            sentiment_response, 
            keyphrases_response, 
            entities_response,
            detected_language
        )
        
        # Compile results
        analysis_result = {
            'language': detected_language,
            'sentiment': sentiment_response['Sentiment'],
            'sentimentScores': sentiment_response['SentimentScore'],
            'keyPhrases': [kp['Text'] for kp in keyphrases_response['KeyPhrases'][:10]],  # Top 10
            'entities': [{'text': e['Text'], 'type': e['Type']} for e in entities_response['Entities'][:5]],  # Top 5
            'isFake': fake_analysis['is_fake'],
            'confidence': fake_analysis['confidence'],
            'fakeReasons': fake_analysis['reasons'],
            'analysisTimestamp': datetime.now().isoformat()
        }
        
        return analysis_result
        
    except Exception as e:
        logger.error(f"Error in Comprehend analysis: {str(e)}")
        # Return basic analysis if Comprehend fails
        return {
            'language': detected_language or 'en',
            'sentiment': 'UNKNOWN',
            'sentimentScores': {},
            'keyPhrases': [],
            'entities': [],
            'isFake': detect_fake_review_basic(review_text)['is_fake'],
            'confidence': 0.5,
            'fakeReasons': ['Basic analysis due to Comprehend error'],
            'analysisTimestamp': datetime.now().isoformat(),
            'error': str(e)
        }

def detect_fake_review_advanced(review_text: str, sentiment_data: Dict, keyphrases_data: Dict, entities_data: Dict, language: str) -> Dict:
    """
    Advanced fake review detection using Comprehend analysis results
    """
    
    is_fake = False
    confidence = 0.5
    reasons = []
    
    # Get sentiment scores
    sentiment_scores = sentiment_data['SentimentScore']
    sentiment = sentiment_data['Sentiment']
    
    # Rule 1: Extremely positive sentiment (potential fake positive)
    if sentiment == 'POSITIVE' and sentiment_scores.get('Positive', 0) > 0.95:
        is_fake = True
        confidence = max(confidence, 0.8)
        reasons.append('Extremely positive sentiment (>95% confidence)')
    
    # Rule 2: Extremely negative sentiment (potential fake negative)
    elif sentiment == 'NEGATIVE' and sentiment_scores.get('Negative', 0) > 0.9:
        is_fake = True
        confidence = max(confidence, 0.75)
        reasons.append('Extremely negative sentiment (>90% confidence)')
    
    # Rule 3: Suspicious key phrases
    key_phrases = [kp['Text'].lower() for kp in keyphrases_data.get('KeyPhrases', [])]
    
    fake_positive_phrases = [
        'best ever', 'amazing experience', 'perfect place', 'highly recommend',
        'five stars', '5 stars', 'outstanding service', 'will definitely come back'
    ]
    
    fake_negative_phrases = [
        'worst ever', 'terrible experience', 'never again', 'waste of money',
        'disgusting food', 'horrible service', 'one star', '1 star'
    ]
    
    positive_phrase_count = sum(1 for phrase in fake_positive_phrases if any(phrase in kp for kp in key_phrases))
    negative_phrase_count = sum(1 for phrase in fake_negative_phrases if any(phrase in kp for kp in key_phrases))
    
    if positive_phrase_count >= 3:
        is_fake = True
        confidence = max(confidence, 0.75)
        reasons.append(f'Multiple suspicious positive phrases ({positive_phrase_count} found)')
    
    if negative_phrase_count >= 3:
        is_fake = True
        confidence = max(confidence, 0.7)
        reasons.append(f'Multiple suspicious negative phrases ({negative_phrase_count} found)')
    
    # Rule 4: Review length analysis
    word_count = len(review_text.split())
    if word_count < 5:
        is_fake = True
        confidence = max(confidence, 0.6)
        reasons.append('Unusually short review (<5 words)')
    elif word_count > 200:
        is_fake = True
        confidence = max(confidence, 0.65)
        reasons.append('Unusually long review (>200 words)')
    
    # Rule 5: Language-specific patterns
    if language == 'ms':  # Bahasa Melayu specific checks
        ms_fake_indicators = ['sangat hebat', 'terbaik sekali', 'pasti datang lagi', 'lima bintang']
        ms_indicator_count = sum(1 for indicator in ms_fake_indicators if indicator in review_text.lower())
        if ms_indicator_count >= 2:
            is_fake = True
            confidence = max(confidence, 0.7)
            reasons.append('Multiple Bahasa Melayu fake indicators')
    
    # Rule 6: Entity analysis (too many specific mentions might be promotional)
    entities = entities_data.get('Entities', [])
    commercial_entities = [e for e in entities if e['Type'] in ['COMMERCIAL_ITEM', 'ORGANIZATION']]
    if len(commercial_entities) > 3:
        confidence = max(confidence, 0.6)
        reasons.append('Multiple commercial entity mentions')
    
    # Final decision
    if not reasons:
        reasons.append('No suspicious patterns detected')
        confidence = 0.3  # Low confidence that it's fake
    
    return {
        'is_fake': is_fake,
        'confidence': confidence,
        'reasons': reasons
    }

def detect_fake_review_basic(review_text: str) -> Dict:
    """Basic fake detection fallback"""
    fake_indicators = ['amazing', 'perfect', 'best ever', 'highly recommend', 'five stars']
    indicator_count = sum(1 for indicator in fake_indicators if indicator in review_text.lower())
    
    is_fake = indicator_count >= 3
    
    return {
        'is_fake': is_fake,
        'confidence': 0.6 if is_fake else 0.4,
        'reasons': ['Basic keyword analysis']
    }

def update_review_analysis(review_id: str, analysis_result: Dict):
    """Update review with analysis results in DynamoDB"""
    
    try:
        reviews_table.update_item(
            Key={'reviewId': review_id},
            UpdateExpression='''
                SET 
                    #lang = :lang,
                    sentiment = :sentiment,
                    isFake = :is_fake,
                    confidence = :confidence,
                    comprehendAnalysis = :analysis,
                    analyzedAt = :timestamp
            ''',
            ExpressionAttributeNames={
                '#lang': 'language'  # 'language' is a reserved word
            },
            ExpressionAttributeValues={
                ':lang': analysis_result['language'],
                ':sentiment': analysis_result['sentiment'],
                ':is_fake': 'true' if analysis_result['isFake'] else 'false',
                ':confidence': analysis_result['confidence'],
                ':analysis': analysis_result,
                ':timestamp': datetime.now().isoformat()
            }
        )
        
        logger.info(f"Updated analysis for review {review_id}")
        
    except Exception as e:
        logger.error(f"Error updating review {review_id}: {str(e)}")
        raise

# For local testing  
if __name__ == "__main__":
    test_event = {
        "analyze_all_pending": True
    }
    
    class MockContext:
        def __init__(self):
            self.function_name = "comprehend-analyzer"
    
    result = lambda_handler(test_event, MockContext())
    print(json.dumps(result, indent=2))