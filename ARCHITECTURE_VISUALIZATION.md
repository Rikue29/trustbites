# 🏗️ TrustBites System Architecture

## AWS Services Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           TrustBites - Fake Review Detection System             │
│                                                                                 │
│  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────────────┐ │
│  │   Frontend      │    │   API Gateway    │    │      Lambda Functions      │ │
│  │   (Next.js)     │◄──►│   REST API       │◄──►│                             │ │
│  │                 │    │                  │    │  ┌─────────────────────────┐ │ │
│  │ • Dashboard     │    │ Endpoints:       │    │  │ api-gateway-handler.py  │ │ │
│  │ • Analytics     │    │ • /restaurants   │    │  │ (Main API Router)       │ │ │
│  │ • Auth System   │    │ • /reviews       │    │  └─────────────────────────┘ │ │
│  └─────────────────┘    │ • /analyze       │    │                             │ │
│                         │ • /scrape        │    │  ┌─────────────────────────┐ │ │
│                         └──────────────────┘    │  │google-places-scraper.py │ │ │
│                                                 │  │ (Data Collection)       │ │ │
│                                                 │  └─────────────────────────┘ │ │
│                                                 │                             │ │
│                                                 │  ┌─────────────────────────┐ │ │
│                                                 │  │comprehend-analyzer.py   │ │ │
│                                                 │  │ (AI Analysis)           │ │ │
│                                                 │  └─────────────────────────┘ │ │
│                                                 └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              AWS AI/ML Services                                 │
│                                                                                 │
│  ┌─────────────────────────┐    ┌─────────────────────────────────────────────┐ │
│  │   Amazon Bedrock        │    │           Amazon Comprehend                 │ │
│  │   (Advanced AI)         │    │           (NLP Analysis)                    │ │
│  │                         │    │                                             │ │
│  │ • Llama 3 70B Model     │    │ • Sentiment Analysis                        │ │
│  │ • Fake Review Detection │    │ • Language Detection                        │ │
│  │ • Advanced Reasoning    │    │ • Key Phrase Extraction                     │ │
│  │ • Confidence Scoring    │    │ • Entity Recognition                        │ │
│  └─────────────────────────┘    │ • Multilingual Support (EN/MS)             │ │
│                                 └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Database Layer                                     │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                           Amazon DynamoDB                                   │ │
│  │                                                                             │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │ │
│  │  │  Restaurants    │  │     Reviews     │  │      AnalyzedReviews        │  │ │
│  │  │                 │  │                 │  │                             │  │ │
│  │  │ • Restaurant ID │  │ • Review ID     │  │ • Analysis ID               │  │ │
│  │  │ • Name          │  │ • Restaurant ID │  │ • Review Hash               │  │ │
│  │  │ • Address       │  │ • Review Text   │  │ • Classification            │  │ │
│  │  │ • Location      │  │ • Author Name   │  │ • Confidence Score          │  │ │
│  │  │ • Cuisine Type  │  │ • Rating        │  │ • AI Model Used             │  │ │
│  │  │ • Google Place  │  │ • Date          │  │ • Sentiment                 │  │ │
│  │  │ • Coordinates   │  │ • Language      │  │ • Reasons                   │  │ │
│  │  └─────────────────┘  │ • Sentiment     │  └─────────────────────────────┘  │ │
│  │                       │ • isFake Status │                                  │ │
│  │  ┌─────────────────┐  └─────────────────┘  ┌─────────────────────────────┐  │ │
│  │  │ BusinessOwners  │                       │      PendingReviews         │  │ │
│  │  │                 │                       │                             │  │ │
│  │  │ • Owner ID      │                       │ • Review ID                 │  │ │
│  │  │ • Email         │                       │ • Status                    │  │ │
│  │  │ • Password Hash │                       │ • Priority                  │  │ │
│  │  │ • Business Name │                       │ • Created At                │  │ │
│  │  │ • Restaurant IDs│                       └─────────────────────────────┘  │ │
│  │  └─────────────────┘                                                        │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           External Integrations                                 │
│                                                                                 │
│  ┌─────────────────────────┐    ┌─────────────────────────────────────────────┐ │
│  │   Google Places API     │    │           Authentication                    │ │
│  │                         │    │                                             │ │
│  │ • Restaurant Search     │    │ • JWT Tokens                                │ │
│  │ • Place Details         │    │ • bcrypt Password Hashing                   │ │
│  │ • Reviews Data          │    │ • Session Management                        │ │
│  │ • Location Data         │    │ • Business Owner Auth                       │ │
│  │ • Photos & Metadata     │    └─────────────────────────────────────────────┘ │
│  └─────────────────────────┘                                                    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Data Processing Pipeline                           │
│                                                                                 │
│  1. Data Collection                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │ Google Places   │───►│ Lambda Scraper  │───►│      DynamoDB               │ │
│  │ API             │    │                 │    │   (Raw Reviews)             │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────────┘ │
│                                                                                 │
│  2. AI Analysis Pipeline                                                        │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │ Pending Reviews │───►│ Bedrock AI      │───►│    Analyzed Results         │ │
│  │ Queue           │    │ + Comprehend    │    │    (Classifications)        │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────────┘ │
│                                                                                 │
│  3. Business Intelligence                                                       │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │ Analysis Data   │───►│ Dashboard API   │───►│      Frontend UI            │ │
│  │                 │    │                 │    │   (Charts & Insights)       │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Regional Architecture (Malaysia-Focused)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           AWS Regional Distribution                             │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                    Primary: ap-southeast-5 (Malaysia)                       │ │
│  │                                                                             │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │ │
│  │  │   Lambda        │  │      S3         │  │        DynamoDB             │  │ │
│  │  │   Functions     │  │   (Future)      │  │                             │  │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                  Fallback: ap-southeast-1 (Singapore)                      │ │
│  │                                                                             │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │ │
│  │  │   Comprehend    │  │    DynamoDB     │  │       Bedrock               │  │ │
│  │  │   (NLP Only)    │  │  (Existing)     │  │    (AI Models)              │  │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Security & Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Security Architecture                              │
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │   Frontend      │    │  Auth Middleware│    │      Protected APIs         │ │
│  │                 │    │                 │    │                             │ │
│  │ • Login Form    │───►│ • JWT Validation│───►│ • Business Dashboard        │ │
│  │ • Registration  │    │ • Session Check │    │ • Restaurant Management     │ │
│  │ • JWT Storage   │    │ • Role-based    │    │ • Analytics Access          │ │
│  └─────────────────┘    │   Access        │    └─────────────────────────────┘ │
│                         └─────────────────┘                                    │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                           Data Security                                     │ │
│  │                                                                             │ │
│  │ • bcrypt Password Hashing                                                   │ │
│  │ • JWT Token-based Authentication                                            │ │
│  │ • DynamoDB Encryption at Rest                                               │ │
│  │ • API Gateway CORS Configuration                                            │ │
│  │ • Environment Variable Protection                                           │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## AI/ML Pipeline Details

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Fake Review Detection Pipeline                       │
│                                                                                 │
│  Input: Raw Review Text                                                         │
│  ┌─────────────────┐                                                           │
│  │ "Amazing food!  │                                                           │
│  │ Best restaurant │                                                           │
│  │ ever! 5 stars!" │                                                           │
│  └─────────────────┘                                                           │
│           │                                                                     │
│           ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                        Dual AI Analysis                                    │ │
│  │                                                                             │ │
│  │  ┌─────────────────────────┐    ┌─────────────────────────────────────────┐ │ │
│  │  │    Amazon Comprehend    │    │         Amazon Bedrock                  │ │ │
│  │  │                         │    │                                         │ │ │
│  │  │ • Language Detection    │    │ • Llama 3 70B Model                     │ │ │
│  │  │ • Sentiment Analysis    │    │ • Advanced Pattern Recognition          │ │ │
│  │  │ • Key Phrase Extract    │    │ • Context Understanding                 │ │ │
│  │  │ • Entity Recognition    │    │ • Confidence Scoring                    │ │ │
│  │  │ • Basic Fake Detection  │    │ • Sophisticated Reasoning               │ │ │
│  │  └─────────────────────────┘    └─────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│           │                                    │                               │
│           ▼                                    ▼                               │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                        Analysis Fusion                                     │ │
│  │                                                                             │ │
│  │ • Combine Comprehend + Bedrock Results                                      │ │
│  │ • Weight Confidence Scores                                                  │ │
│  │ • Apply Business Rules                                                      │ │
│  │ • Generate Final Classification                                             │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│           │                                                                     │
│           ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                         Output                                              │ │
│  │                                                                             │ │
│  │ Classification: "fake"                                                      │ │
│  │ Confidence: 0.89                                                            │ │
│  │ Reasons: ["excessive_superlatives", "generic_praise"]                       │ │
│  │ Sentiment: "positive"                                                       │ │
│  │ Explanation: "Multiple promotional phrases detected"                        │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Cost Optimization Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Cost Structure                                     │
│                                                                                 │
│  ┌─────────────────────────┐    ┌─────────────────────────────────────────────┐ │
│  │     Low-Cost Tier       │    │           Premium Features                  │ │
│  │                         │    │                                             │ │
│  │ • DynamoDB On-Demand    │    │ • Bedrock AI Analysis                       │ │
│  │ • Lambda Free Tier      │    │ • Advanced ML Models                        │ │
│  │ • API Gateway Free Tier │    │ • Real-time Processing                      │ │
│  │ • Basic Comprehend      │    │ • Custom Model Training                     │ │
│  └─────────────────────────┘    └─────────────────────────────────────────────┘ │
│                                                                                 │
│  Estimated Monthly Cost (1000 restaurants, 10K reviews):                       │
│  • DynamoDB: ~$5-10                                                            │
│  • Lambda: ~$2-5                                                               │
│  • API Gateway: ~$3-7                                                          │
│  • Comprehend: ~$10-20                                                         │
│  • Bedrock: ~$15-30                                                            │
│  Total: ~$35-72/month                                                          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Scalability & Performance

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Performance Characteristics                           │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                          Throughput Capacity                               │ │
│  │                                                                             │ │
│  │ • API Gateway: 10,000 requests/second                                       │ │
│  │ • Lambda: 1,000 concurrent executions                                       │ │
│  │ • DynamoDB: 40,000 read/write capacity units                                │ │
│  │ • Comprehend: 100 requests/second                                           │ │
│  │ • Bedrock: 20 requests/second (model dependent)                             │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                           Auto-Scaling Features                            │ │
│  │                                                                             │ │
│  │ • Lambda: Automatic scaling based on demand                                 │ │
│  │ • DynamoDB: On-demand scaling for unpredictable workloads                   │ │
│  │ • API Gateway: Built-in load balancing                                      │ │
│  │ • Batch Processing: Queue-based review analysis                             │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```