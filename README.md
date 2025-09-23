# 🍽️ TrustBites AI: Bites you can trust

[![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black.svg)](https://nextjs.org/)
[![AWS](https://img.shields.io/badge/AWS-Bedrock%20%2B%20Comprehend-orange.svg)](https://aws.amazon.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Deployed](https://img.shields.io/badge/Deployed-AWS%20Amplify-green.svg)](https://main.dtgvxjw6jg7d8.amplifyapp.com/)

> **AI-powered restaurant review trustworthiness platform that detects fake reviews using AWS Bedrock and Comprehend**

## 🌟 **Live Demo**
**🚀 [https://main.dtgvxjw6jg7d8.amplifyapp.com/](https://main.dtgvxjw6jg7d8.amplifyapp.com/)**

## 📋 **Overview**

TrustBites AI is a sophisticated restaurant review analysis platform that combines cutting-edge AI technologies to help users identify trustworthy restaurant reviews. Using AWS Bedrock's advanced language models and AWS Comprehend's natural language processing, the system provides real-time fake review detection with detailed confidence scoring.

### 🎯 **Key Features**

- **🤖 AI-Powered Fake Review Detection** - Multi-model analysis using AWS Bedrock (Llama 3 70B, DeepSeek-R1)
- **🧠 Sentiment Analysis** - AWS Comprehend integration for emotion and language detection
- **📍 Location-Based Restaurant Search** - Google Places API integration with real-time mapping
- **📊 Trust Score Analytics** - Comprehensive restaurant trustworthiness scoring
- **💾 Smart Caching** - DynamoDB-powered analysis caching for improved performance
- **🎨 Modern UI/UX** - Responsive design with real-time updates and interactive maps

## 🏗️ **Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   AI Services   │
│   Next.js 15    │───▶│   Route Handlers│───▶│   AWS Bedrock   │
│   React         │    │   TypeScript    │    │   AWS Comprehend│
│   Tailwind CSS  │    │                 │    │   Llama 3 70B   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   Data Layer    │              │
         └──────────────│   DynamoDB      │──────────────┘
                        │   Analysis Cache│
                        │   Google Places │
                        └─────────────────┘
```

## 🚀 **Technology Stack**

### **Frontend**
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Chart.js** - Data visualization
- **Google Maps API** - Location services and mapping

### **Backend**
- **Next.js API Routes** - Serverless backend functions
- **AWS SDK v3** - Cloud service integration
- **DynamoDB** - NoSQL database for caching and storage

### **AI & Machine Learning**
- **AWS Bedrock** - Foundation models (Llama 3 70B, DeepSeek-R1)
- **AWS Comprehend** - Natural language processing
- **Custom AI Logic** - Pattern recognition and confidence scoring

### **External APIs**
- **Google Places API** - Restaurant data and reviews
- **Google Maps JavaScript API** - Interactive mapping

### **Deployment**
- **AWS Amplify** - Hosting and CI/CD
- **GitHub** - Version control and automated deployments

## 🛠️ **Installation & Setup**

### **Prerequisites**
- Node.js 18+ 
- AWS Account with Bedrock and Comprehend access
- Google Cloud Account with Places API enabled

### **1. Clone Repository**
```bash
git clone https://github.com/Rikue29/trustbites.git
cd trustbites
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Environment Configuration**
Create `.env.local` file:
```bash
# AWS Configuration
TRUSTBITES_AWS_REGION=ap-southeast-1
TRUSTBITES_ACCESS_KEY_ID=your_aws_access_key
TRUSTBITES_SECRET_ACCESS_KEY=your_aws_secret_key
BEDROCK_REGION=us-east-1

# Google APIs
GOOGLE_PLACES_API_KEY=your_google_places_api_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### **4. AWS Setup**
1. **Enable Bedrock Models** in AWS Console (us-east-1)
   - Llama 3 70B Instruct
   - DeepSeek-R1 Distill Llama 70B
2. **Configure IAM Permissions**:
   - `bedrock:InvokeModel`
   - `comprehend:DetectSentiment`
   - `comprehend:DetectDominantLanguage`
   - `dynamodb:PutItem`
   - `dynamodb:GetItem`
   - `dynamodb:Query`

### **5. Run Development Server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🧪 **Testing**

### **Test Bedrock AI Integration**
```bash
# Test pending review analysis
curl -X POST https://main.dtgvxjw6jg7d8.amplifyapp.com/api/ai/bedrock \
  -H "Content-Type: application/json" \
  -d '{"action": "analyze-pending"}'
```

### **Test Comprehend Sentiment Analysis**
```bash
# Test fake review detection
curl -X POST https://main.dtgvxjw6jg7d8.amplifyapp.com/api/reviews \
  -H "Content-Type: application/json" \
  -d '{"reviewText": "OMG best food ever!!! Amazing amazing amazing!!!", "rating": 5, "restaurantId": "test", "authorName": "Test User"}'
```

### **Test Restaurant Search**
```bash
# Test location-based search
curl "https://main.dtgvxjw6jg7d8.amplifyapp.com/api/restaurants/search?lat=3.0086&lng=101.7149&radius=5000"
```

## 📊 **AI Analysis Features**

### **Fake Review Detection Indicators**
- **Excessive Emotion** - Overly enthusiastic language patterns
- **Generic Language** - Lack of specific details
- **Sentiment Mismatch** - Rating doesn't match review sentiment
- **Language Patterns** - Unnatural phrasing or repetition
- **Temporal Analysis** - Review timing patterns

### **Trust Score Calculation**
```typescript
Trust Score = (Genuine Reviews / Total Reviews) × 100
Confidence Level = Average AI Confidence Across All Reviews
```

### **Supported Languages**
- English (primary)
- Multi-language support via AWS Comprehend

## 🗂️ **Project Structure**

```
trustbites/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── ai/bedrock/    # Bedrock AI endpoints
│   │   │   ├── restaurants/   # Restaurant data APIs
│   │   │   └── reviews/       # Review analysis APIs
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx          # Main application
│   ├── components/            # React components
│   │   ├── GoogleMap.tsx      # Map integration
│   │   └── TrustBitesLogo.tsx # Brand logo
│   ├── lib/                   # Utility libraries
│   │   ├── aws-config-compliant.ts # AWS client configuration
│   │   ├── db.ts             # Database operations
│   │   └── price-utils.ts    # Price formatting
│   └── bedrock-ai.ts         # AI analysis logic
├── amplify.yml               # AWS Amplify configuration
├── test-bedrock.js          # Bedrock testing script
├── test-comprehend.js       # Comprehend testing script
└── README.md               # This file
```

## 🔧 **Configuration**

### **AWS Amplify Deployment**
The project includes an `amplify.yml` configuration for seamless deployment:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - echo "GOOGLE_PLACES_API_KEY=$GOOGLE_PLACES_API_KEY" >> .env
        - echo "TRUSTBITES_ACCESS_KEY_ID=$TRUSTBITES_ACCESS_KEY_ID" >> .env
        - echo "TRUSTBITES_SECRET_ACCESS_KEY=$TRUSTBITES_SECRET_ACCESS_KEY" >> .env
        - echo "TRUSTBITES_AWS_REGION=$TRUSTBITES_AWS_REGION" >> .env
        - echo "BEDROCK_REGION=$BEDROCK_REGION" >> .env
        - echo "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" >> .env
        - npm run build
```

## 📈 **Performance & Scalability**

- **Caching Strategy** - DynamoDB caching for analyzed reviews
- **Regional Optimization** - Malaysia (ap-southeast-5) and Singapore (ap-southeast-1) regions
- **Serverless Architecture** - Auto-scaling with AWS Lambda
- **CDN Integration** - AWS Amplify's global content delivery

## 🔐 **Security**

- **Environment Variables** - Secure credential management
- **AWS IAM** - Fine-grained permission control
- **HTTPS Enforcement** - SSL/TLS encryption
- **Input Validation** - Comprehensive request sanitization

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **AWS Bedrock** - For providing advanced language models
- **AWS Comprehend** - For natural language processing capabilities
- **Google Places API** - For comprehensive restaurant data
- **Next.js Team** - For the amazing React framework
- **Vercel** - For hosting and deployment tools

## 📞 **Support**

For support and questions:
- 📧 Email: [Your Email]
- 🐛 Issues: [GitHub Issues](https://github.com/Rikue29/trustbites/issues)
- 📖 Documentation: [Project Wiki](https://github.com/Rikue29/trustbites/wiki)

---

**Built with ❤️ for restaurant transparency and trust**
