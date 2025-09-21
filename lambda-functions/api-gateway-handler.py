"""
API Gateway Lambda for TrustBites Backend
Handles HTTP requests and orchestrates the workflow
"""

import json
import boto3
import logging
from datetime import datetime
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS clients
lambda_client = boto3.client('lambda')
dynamodb = boto3.resource('dynamodb')
restaurants_table = dynamodb.Table('Restaurants')
reviews_table = dynamodb.Table('Reviews')
analysis_table = dynamodb.Table('AnalysisResults')

def lambda_handler(event, context):
    """
    Main API Gateway handler
    Routes requests to appropriate functions
    """
    
    try:
        # Parse request
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        query_params = event.get('queryStringParameters') or {}
        body = {}
        
        if event.get('body'):
            try:
                body = json.loads(event['body'])
            except json.JSONDecodeError:
                return create_response(400, {'error': 'Invalid JSON in request body'})
        
        logger.info(f"{http_method} {path} - {query_params}")
        
        # Route requests
        if path == '/api/restaurants':
            if http_method == 'GET':
                return handle_get_restaurants(query_params)
            elif http_method == 'POST':
                return handle_add_restaurant(body)
                
        elif path == '/api/restaurants/search':
            return handle_search_restaurants(query_params)
            
        elif path.startswith('/api/restaurants/') and path.endswith('/reviews'):
            restaurant_id = path.split('/')[3]  # Extract restaurant ID from path
            if http_method == 'GET':
                return handle_get_restaurant_reviews(restaurant_id, query_params)
                
        elif path == '/api/analyze':
            if http_method == 'POST':
                return handle_trigger_analysis(body)
                
        elif path == '/api/scrape':
            if http_method == 'POST':
                return handle_trigger_scraping(body)
                
        elif path.startswith('/api/analysis/'):
            analysis_id = path.split('/')[3]
            return handle_get_analysis_results(analysis_id)
            
        else:
            return create_response(404, {'error': 'Endpoint not found'})
            
    except Exception as e:
        logger.error(f"Error in API handler: {str(e)}")
        return create_response(500, {'error': 'Internal server error'})

def handle_get_restaurants(query_params: Dict) -> Dict:
    """
    GET /api/restaurants
    Optional query parameters:
    - location: Filter by location
    - cuisine: Filter by cuisine type
    - limit: Number of results (default 50)
    """
    
    try:
        location = query_params.get('location')
        cuisine = query_params.get('cuisine')
        limit = int(query_params.get('limit', 50))
        
        if location:
            # Query by location using GSI
            response = restaurants_table.query(
                IndexName='LocationIndex',
                KeyConditionExpression='location = :loc',
                ExpressionAttributeValues={':loc': location},
                Limit=limit
            )
        elif cuisine:
            # Query by cuisine using GSI
            response = restaurants_table.query(
                IndexName='CuisineIndex',
                KeyConditionExpression='cuisine = :cuisine',
                ExpressionAttributeValues={':cuisine': cuisine},
                Limit=limit
            )
        else:
            # Scan all restaurants
            response = restaurants_table.scan(Limit=limit)
        
        restaurants = response.get('Items', [])
        
        # Add summary statistics for each restaurant
        for restaurant in restaurants:
            try:
                stats = get_restaurant_review_stats(restaurant['restaurantId'])
                restaurant.update(stats)
            except Exception as e:
                logger.error(f"Error getting stats for {restaurant['restaurantId']}: {str(e)}")
        
        return create_response(200, {
            'success': True,
            'restaurants': restaurants,
            'count': len(restaurants)
        })
        
    except Exception as e:
        logger.error(f"Error in get_restaurants: {str(e)}")
        return create_response(500, {'error': str(e)})

def handle_search_restaurants(query_params: Dict) -> Dict:
    """
    GET /api/restaurants/search?q=restaurant+name&location=city
    Search restaurants by name and location
    """
    
    try:
        search_query = query_params.get('q', '').lower()
        location = query_params.get('location', '')
        
        if not search_query:
            return create_response(400, {'error': 'Search query (q) is required'})
        
        # Scan restaurants and filter by name (DynamoDB doesn't support text search)
        response = restaurants_table.scan()
        restaurants = response.get('Items', [])
        
        # Filter results
        filtered_restaurants = []
        for restaurant in restaurants:
            name_match = search_query in restaurant.get('name', '').lower()
            location_match = not location or location.lower() in restaurant.get('location', '').lower()
            
            if name_match and location_match:
                filtered_restaurants.append(restaurant)
        
        return create_response(200, {
            'success': True,
            'restaurants': filtered_restaurants[:20],  # Limit results
            'count': len(filtered_restaurants)
        })
        
    except Exception as e:
        logger.error(f"Error in search_restaurants: {str(e)}")
        return create_response(500, {'error': str(e)})

def handle_get_restaurant_reviews(restaurant_id: str, query_params: Dict) -> Dict:
    """
    GET /api/restaurants/{id}/reviews
    Get reviews for a specific restaurant
    """
    
    try:
        limit = int(query_params.get('limit', 50))
        fake_filter = query_params.get('fake')  # 'true', 'false', or None for all
        
        # Query reviews for restaurant
        key_condition = 'restaurantId = :rid'
        expression_values = {':rid': restaurant_id}
        
        # Add fake filter if specified
        filter_expression = None
        if fake_filter:
            filter_expression = 'isFake = :fake'
            expression_values[':fake'] = fake_filter.lower()
        
        query_params_dynamo = {
            'IndexName': 'RestaurantIndex',
            'KeyConditionExpression': key_condition,
            'ExpressionAttributeValues': expression_values,
            'Limit': limit,
            'ScanIndexForward': False  # Latest reviews first
        }
        
        if filter_expression:
            query_params_dynamo['FilterExpression'] = filter_expression
        
        response = reviews_table.query(**query_params_dynamo)
        reviews = response.get('Items', [])
        
        return create_response(200, {
            'success': True,
            'restaurant_id': restaurant_id,
            'reviews': reviews,
            'count': len(reviews)
        })
        
    except Exception as e:
        logger.error(f"Error getting reviews for restaurant {restaurant_id}: {str(e)}")
        return create_response(500, {'error': str(e)})

def handle_trigger_scraping(body: Dict) -> Dict:
    """
    POST /api/scrape
    Trigger Google Maps scraping for a restaurant
    Body: {"restaurant_name": "Name", "location": "City", "max_reviews": 50}
    """
    
    try:
        restaurant_name = body.get('restaurant_name')
        location = body.get('location', 'Kuala Lumpur, Malaysia')
        max_reviews = body.get('max_reviews', 50)
        
        if not restaurant_name:
            return create_response(400, {'error': 'restaurant_name is required'})
        
        # Invoke scraper Lambda
        scraper_payload = {
            'restaurant_name': restaurant_name,
            'location': location,
            'max_reviews': max_reviews
        }
        
        response = lambda_client.invoke(
            FunctionName='trustbites-google-scraper',  # Update with actual function name
            InvocationType='RequestResponse',
            Payload=json.dumps(scraper_payload)
        )
        
        result = json.loads(response['Payload'].read())
        
        if response['StatusCode'] == 200:
            return create_response(200, {
                'success': True,
                'message': 'Scraping completed',
                'result': result
            })
        else:
            return create_response(500, {
                'success': False,
                'error': 'Scraping failed',
                'details': result
            })
            
    except Exception as e:
        logger.error(f"Error triggering scraping: {str(e)}")
        return create_response(500, {'error': str(e)})

def handle_trigger_analysis(body: Dict) -> Dict:
    """
    POST /api/analyze  
    Trigger review analysis
    Body: {"restaurant_id": "rest_123"} or {"review_ids": ["rev_1", "rev_2"]}
    """
    
    try:
        # Invoke Comprehend analyzer Lambda
        analyzer_payload = body
        
        response = lambda_client.invoke(
            FunctionName='trustbites-comprehend-analyzer',  # Update with actual function name
            InvocationType='RequestResponse', 
            Payload=json.dumps(analyzer_payload)
        )
        
        result = json.loads(response['Payload'].read())
        
        if response['StatusCode'] == 200:
            return create_response(200, {
                'success': True,
                'message': 'Analysis completed',
                'result': result
            })
        else:
            return create_response(500, {
                'success': False,
                'error': 'Analysis failed',
                'details': result
            })
            
    except Exception as e:
        logger.error(f"Error triggering analysis: {str(e)}")
        return create_response(500, {'error': str(e)})

def handle_add_restaurant(body: Dict) -> Dict:
    """
    POST /api/restaurants
    Manually add a restaurant (for testing)
    """
    
    try:
        import uuid
        
        restaurant_id = f"rest_{uuid.uuid4().hex[:8]}"
        
        item = {
            'restaurantId': restaurant_id,
            'name': body.get('name'),
            'address': body.get('address'),
            'location': body.get('location'),
            'cuisine': body.get('cuisine', 'Unknown'),
            'latitude': body.get('latitude', 0.0),
            'longitude': body.get('longitude', 0.0),
            'avgRating': body.get('avgRating', 0.0),
            'totalReviews': body.get('totalReviews', 0),
            'lastScraped': datetime.now().isoformat(),
            'googlePlaceId': body.get('googlePlaceId', '')
        }
        
        restaurants_table.put_item(Item=item)
        
        return create_response(201, {
            'success': True,
            'restaurant_id': restaurant_id,
            'restaurant': item
        })
        
    except Exception as e:
        logger.error(f"Error adding restaurant: {str(e)}")
        return create_response(500, {'error': str(e)})

def get_restaurant_review_stats(restaurant_id: str) -> Dict:
    """Get review statistics for a restaurant"""
    
    try:
        # Query all reviews for restaurant
        response = reviews_table.query(
            IndexName='RestaurantIndex',
            KeyConditionExpression='restaurantId = :rid',
            ExpressionAttributeValues={':rid': restaurant_id}
        )
        
        reviews = response.get('Items', [])
        
        if not reviews:
            return {
                'reviewCount': 0,
                'fakeCount': 0,
                'fakePercentage': 0.0,
                'sentimentBreakdown': {}
            }
        
        # Calculate statistics
        total_reviews = len(reviews)
        fake_reviews = len([r for r in reviews if r.get('isFake') == 'true'])
        fake_percentage = (fake_reviews / total_reviews) * 100 if total_reviews > 0 else 0.0
        
        # Sentiment breakdown
        sentiments = {}
        for review in reviews:
            sentiment = review.get('sentiment', 'UNKNOWN')
            sentiments[sentiment] = sentiments.get(sentiment, 0) + 1
        
        return {
            'reviewCount': total_reviews,
            'fakeCount': fake_reviews,
            'fakePercentage': round(fake_percentage, 2),
            'sentimentBreakdown': sentiments
        }
        
    except Exception as e:
        logger.error(f"Error getting restaurant stats: {str(e)}")
        return {}

def create_response(status_code: int, body: Dict) -> Dict:
    """Create properly formatted API Gateway response"""
    
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',  # For CORS
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        'body': json.dumps(body, default=str)  # Handle datetime serialization
    }

# For local testing
if __name__ == "__main__":
    # Test different endpoints
    test_events = [
        {
            'httpMethod': 'GET',
            'path': '/api/restaurants',
            'queryStringParameters': {'location': 'Kuala Lumpur'}
        },
        {
            'httpMethod': 'POST',
            'path': '/api/scrape',
            'body': json.dumps({
                'restaurant_name': 'Village Park Restaurant',
                'location': 'Petaling Jaya, Malaysia',
                'max_reviews': 10
            })
        }
    ]
    
    class MockContext:
        def __init__(self):
            self.function_name = "trustbites-api"
    
    for test_event in test_events:
        print(f"\n=== Testing {test_event['httpMethod']} {test_event['path']} ===")
        result = lambda_handler(test_event, MockContext())
        print(json.dumps(result, indent=2))