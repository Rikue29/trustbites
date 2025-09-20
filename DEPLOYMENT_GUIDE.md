# 🚀 TrustBites Backend Deployment Guide

## Overview
This backend system provides a comprehensive AWS-powered solution for detecting fake restaurant reviews with multilingual support (English + Bahasa Melayu).

## 📋 Architecture Components

### 🗄️ **Database Layer (DynamoDB)**
- **Restaurants Table**: Store restaurant metadata and Google Place IDs
- **Reviews Table**: Store scraped reviews with analysis results  
- **AnalysisResults Table**: Store aggregated analysis data for dashboards

### ⚡ **Lambda Functions**
1. **google-maps-scraper.py**: Scrapes reviews from Google Maps
2. **comprehend-analyzer.py**: Analyzes reviews using Amazon Comprehend
3. **api-gateway-handler.py**: Handles HTTP requests and orchestrates workflow

### 🌐 **API Endpoints**
- `GET /api/restaurants` - List restaurants with filters
- `GET /api/restaurants/{id}/reviews` - Get reviews for specific restaurant
- `POST /api/scrape` - Trigger Google Maps scraping
- `POST /api/analyze` - Trigger review analysis
- `GET /api/restaurants/search` - Search restaurants by name/location

## 🔧 Deployment Steps

### Step 1: Create DynamoDB Tables
```bash
# From your project directory
npm run create-schema
```

### Step 2: Deploy Lambda Functions

#### A. Package Lambda Functions
```bash
# Create deployment packages
mkdir lambda-packages
cd lambda-packages

# Package 1: Google Maps Scraper
mkdir google-scraper
cp ../lambda-functions/google-maps-scraper.py google-scraper/lambda_function.py
cd google-scraper
pip install boto3 requests -t .
zip -r ../google-scraper.zip .
cd ..

# Package 2: Comprehend Analyzer  
mkdir comprehend-analyzer
cp ../lambda-functions/comprehend-analyzer.py comprehend-analyzer/lambda_function.py
cd comprehend-analyzer
pip install boto3 -t .
zip -r ../comprehend-analyzer.zip .
cd ..

# Package 3: API Gateway Handler
mkdir api-handler
cp ../lambda-functions/api-gateway-handler.py api-handler/lambda_function.py
cd api-handler
pip install boto3 -t . 
zip -r ../api-handler.zip .
cd ..
```

#### B. Create Lambda Functions via AWS CLI
```bash
# 1. Google Maps Scraper
aws lambda create-function \
  --function-name trustbites-google-scraper \
  --runtime python3.9 \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://google-scraper.zip \
  --timeout 300 \
  --memory-size 512

# 2. Comprehend Analyzer
aws lambda create-function \
  --function-name trustbites-comprehend-analyzer \
  --runtime python3.9 \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://comprehend-analyzer.zip \
  --timeout 300 \
  --memory-size 512

# 3. API Gateway Handler
aws lambda create-function \
  --function-name trustbites-api-handler \
  --runtime python3.9 \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://api-handler.zip \
  --timeout 30 \
  --memory-size 256
```

### Step 3: Create API Gateway
```bash
# Create REST API
aws apigateway create-rest-api \
  --name trustbites-api \
  --description "TrustBites Fake Review Detection API"

# Get API ID (replace in subsequent commands)
API_ID="your-api-id"
RESOURCE_ID="your-root-resource-id"

# Create /api resource
aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $RESOURCE_ID \
  --path-part api

# Create /api/restaurants resource
aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $API_RESOURCE_ID \
  --path-part restaurants

# Add GET method to /api/restaurants
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $RESTAURANTS_RESOURCE_ID \
  --http-method GET \
  --authorization-type NONE

# Configure Lambda integration
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $RESTAURANTS_RESOURCE_ID \
  --http-method GET \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:ap-southeast-1:lambda:path/2015-03-31/functions/arn:aws:lambda:ap-southeast-1:YOUR_ACCOUNT:function:trustbites-api-handler/invocations

# Deploy API
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod
```

### Step 4: Configure IAM Permissions

#### Lambda Execution Role Policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream", 
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:ap-southeast-1:YOUR_ACCOUNT:table/Restaurants",
        "arn:aws:dynamodb:ap-southeast-1:YOUR_ACCOUNT:table/Reviews", 
        "arn:aws:dynamodb:ap-southeast-1:YOUR_ACCOUNT:table/AnalysisResults",
        "arn:aws:dynamodb:ap-southeast-1:YOUR_ACCOUNT:table/*/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "comprehend:DetectSentiment",
        "comprehend:DetectDominantLanguage",
        "comprehend:DetectKeyPhrases",
        "comprehend:DetectEntities"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": [
        "arn:aws:lambda:ap-southeast-1:YOUR_ACCOUNT:function:trustbites-*"
      ]
    }
  ]
}
```

## 🧪 Testing Your Backend

### 1. Test Restaurant Scraping
```bash
curl -X POST https://your-api-id.execute-api.ap-southeast-1.amazonaws.com/prod/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "restaurant_name": "Village Park Restaurant",
    "location": "Petaling Jaya, Malaysia", 
    "max_reviews": 20
  }'
```

### 2. Test Review Analysis
```bash
curl -X POST https://your-api-id.execute-api.ap-southeast-1.amazonaws.com/prod/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "analyze_all_pending": true
  }'
```

### 3. Get Restaurant Data
```bash
curl "https://your-api-id.execute-api.ap-southeast-1.amazonaws.com/prod/api/restaurants?location=Kuala%20Lumpur"
```

### 4. Get Restaurant Reviews
```bash
curl "https://your-api-id.execute-api.ap-southeast-1.amazonaws.com/prod/api/restaurants/rest_12345678/reviews?fake=false"
```

## 📊 Hackathon Demo Flow

### 1. **Data Ingestion Demo**
```bash
# Scrape a popular Malaysian restaurant
curl -X POST https://your-api-endpoint/api/scrape \
  -d '{"restaurant_name": "Jalan Alor Food Street", "location": "Kuala Lumpur", "max_reviews": 30}'
```

### 2. **AI Analysis Demo**
```bash
# Trigger Comprehend analysis
curl -X POST https://your-api-endpoint/api/analyze \
  -d '{"analyze_all_pending": true}'
```

### 3. **Results Visualization**
```bash
# Get analyzed results with fake detection
curl "https://your-api-endpoint/api/restaurants/rest_12345678/reviews"
```

### 4. **Multilingual Support Demo**
- Show reviews in both English and Bahasa Melayu
- Demonstrate sentiment analysis in both languages
- Show fake detection working across languages

## 🎯 Hackathon Judging Points

### ✅ **Technical Innovation**
- **Multilingual NLP**: English + Bahasa Melayu support
- **Advanced ML Pipeline**: Comprehend + custom fake detection
- **Scalable Architecture**: Serverless AWS stack

### ✅ **Real-World Impact**
- **Consumer Protection**: Helps users avoid fake reviews
- **Business Value**: Helps restaurants maintain credibility
- **Local Relevance**: Supports Malaysian market specifically

### ✅ **AWS Service Integration**
- **Amazon Comprehend**: Sentiment analysis, language detection
- **DynamoDB**: NoSQL database with GSI for efficient queries
- **Lambda**: Serverless compute for scalability
- **API Gateway**: RESTful API endpoints
- **Future**: SageMaker for custom ML models

## 🚀 Next Steps for Production

1. **Enhanced Scraping**: 
   - Implement proper Google Maps API integration
   - Add rate limiting and CAPTCHA handling
   - Support for multiple review sources

2. **Advanced ML**:
   - Train custom SageMaker model for fake detection
   - Implement review clustering for pattern detection
   - Add anomaly detection for reviewer behavior

3. **Location Services**:
   - Integrate AWS Location Service for map-based discovery
   - Add geospatial queries for nearby restaurants

4. **Analytics Dashboard**:
   - QuickSight integration for business owners
   - Real-time monitoring and alerting
   - Trend analysis and reporting

## 📝 Environment Variables
Set these in your Lambda functions:
```
AWS_REGION=ap-southeast-1
DYNAMODB_RESTAURANTS_TABLE=Restaurants
DYNAMODB_REVIEWS_TABLE=Reviews
DYNAMODB_ANALYSIS_TABLE=AnalysisResults
```