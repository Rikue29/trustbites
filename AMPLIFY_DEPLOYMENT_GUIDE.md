# 🚀 TrustBites AI - AWS Amplify Deployment Guide

This guide will help you deploy your TrustBites AI application to AWS Amplify with all required AWS services.

## 📋 Prerequisites

Before deploying, ensure you have:

1. **AWS Account** with appropriate permissions
2. **GitHub Repository** with your TrustBites code
3. **Google Cloud Console** account for Maps API
4. **AWS CLI** installed and configured (optional but recommended)

## 🛠️ Pre-Deployment Setup

### 1. AWS Services Configuration

#### DynamoDB Tables
Your app requires these DynamoDB tables (will be created automatically):
- `AnalyzedReviews` - Stores AI analysis results
- `TrustBites-Users` - User authentication data
- `TrustBites-Restaurants` - Restaurant information
- `TrustBites-Reviews` - Review data

#### AWS Bedrock Access
1. Go to AWS Bedrock console in **us-east-1** region
2. Request access to **Llama 3 70B** model
3. Ensure your AWS account has Bedrock permissions

#### IAM Permissions
Ensure your AWS credentials have these permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:*",
        "bedrock:*",
        "comprehend:*",
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "*"
    }
  ]
}
```

### 2. Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create credentials → API Key
5. Restrict the API key to your domain

## 🚀 Deployment Steps

### Step 1: Prepare Your Repository

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Amplify deployment"
   git push origin main
   ```

2. **Verify your files include:**
   - ✅ `amplify.yml` - Build configuration
   - ✅ `next.config.ts` - Optimized Next.js config
   - ✅ `verify-aws-services.js` - AWS verification script
   - ✅ `.env.example` - Environment variable template

### Step 2: Connect to AWS Amplify

1. **Go to AWS Amplify Console:**
   - Open [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Click "New app" → "Host web app"

2. **Connect Repository:**
   - Select "GitHub"
   - Authorize AWS Amplify to access your repositories
   - Select your TrustBites repository
   - Choose `main` branch

3. **Configure Build Settings:**
   - Amplify will detect `amplify.yml` automatically
   - Review the build configuration
   - Click "Next"

### Step 3: Environment Variables Configuration

In the Amplify console, add these environment variables:

#### Required Variables:
```bash
# AWS Configuration (Note: Use TRUSTBITES_ prefix, not AWS_)
TRUSTBITES_ACCESS_KEY_ID=your_access_key_here
TRUSTBITES_SECRET_ACCESS_KEY=your_secret_key_here
TRUSTBITES_AWS_REGION=ap-southeast-1
BEDROCK_REGION=us-east-1

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Authentication
NEXTAUTH_SECRET=your-32-character-secret-here
NEXTAUTH_URL=https://your-app-name.amplifyapp.com
JWT_SECRET=your-jwt-secret-here

# Database Tables
DYNAMODB_ANALYZED_REVIEWS_TABLE=AnalyzedReviews
DYNAMODB_USERS_TABLE=TrustBites-Users
DYNAMODB_RESTAURANTS_TABLE=TrustBites-Restaurants
DYNAMODB_REVIEWS_TABLE=TrustBites-Reviews

# Application
NODE_ENV=production
```

#### How to set environment variables:
1. In Amplify console → Your App → Environment variables
2. Click "Manage variables"
3. Add each variable from the list above
4. Click "Save"

### Step 4: Deploy Application

1. **Start Deployment:**
   - Click "Save and deploy"
   - Amplify will start building your app

2. **Monitor Build Process:**
   - Watch the build logs for any errors
   - The verification script will run during `preBuild`
   - Build should complete in 5-10 minutes

3. **Access Your App:**
   - Once deployed, you'll get a URL like: `https://main.xxxxxxxxx.amplifyapp.com`
   - Update `NEXTAUTH_URL` environment variable with this URL

## 🔍 Post-Deployment Verification

### 1. Test Core Features:
- ✅ Map loads with restaurant markers
- ✅ Search functionality works
- ✅ Restaurant selection and analysis works
- ✅ AI review analysis completes successfully
- ✅ Dashboard displays data correctly

### 2. Check AWS Services:
```bash
# Run verification locally to ensure services work
npm run verify-aws-setup
```

### 3. Monitor Logs:
- Check Amplify build logs for any warnings
- Monitor CloudWatch logs for runtime errors
- Test API endpoints in browser network tab

## 🐛 Troubleshooting

### Common Issues:

#### Build Failures:
- **Issue:** Environment variables not set
- **Solution:** Verify all required env vars in Amplify console

#### API Errors:
- **Issue:** AWS credentials invalid
- **Solution:** Check IAM permissions and rotate keys if needed

#### Map Not Loading:
- **Issue:** Google Maps API key issues
- **Solution:** Verify API key restrictions and billing enabled

#### Database Errors:
- **Issue:** DynamoDB permissions
- **Solution:** Ensure DynamoDB permissions in IAM policy

### Getting Help:
1. Check Amplify build logs in console
2. Review AWS CloudWatch logs
3. Test locally with same environment variables

## 🎯 Performance Optimization

### Recommended Settings:
1. **Enable Amplify caching**
2. **Configure CloudFront distribution**
3. **Monitor AWS costs** (Bedrock, DynamoDB, API calls)
4. **Set up CloudWatch alarms** for error rates

## 🔒 Security Considerations

1. **Environment Variables:** Never commit sensitive keys to Git
2. **API Restrictions:** Restrict Google Maps API to your domain
3. **CORS Settings:** Configure proper CORS for production
4. **HTTPS:** Amplify provides HTTPS by default

## 📊 Monitoring & Maintenance

1. **AWS CloudWatch:** Monitor API calls and errors
2. **DynamoDB Metrics:** Track read/write capacity
3. **Bedrock Usage:** Monitor AI model usage and costs
4. **User Analytics:** Set up user behavior tracking

---

## 🎉 Congratulations!

Your TrustBites AI application is now live on AWS Amplify! 

**Your app URL:** `https://your-app-name.amplifyapp.com`

### Next Steps:
1. **Custom Domain:** Add your own domain in Amplify settings
2. **SSL Certificate:** Configure custom SSL if using custom domain
3. **Performance Testing:** Test with real traffic patterns
4. **User Feedback:** Gather feedback and iterate

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review AWS Amplify documentation
3. Check AWS service status pages
4. Contact AWS support if needed

Happy deploying! 🚀