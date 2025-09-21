# 📋 TrustBites AI - Deployment Checklist

## Pre-Deployment ✅

### AWS Setup
- [ ] AWS account with proper permissions
- [ ] DynamoDB access in ap-southeast-1
- [ ] Bedrock access in us-east-1 (Llama 3 70B)
- [ ] IAM permissions for DynamoDB, Bedrock, Comprehend

### Google Services
- [ ] Google Cloud Console project
- [ ] Maps JavaScript API enabled
- [ ] Places API enabled
- [ ] Geocoding API enabled
- [ ] API key created and restricted

### Code Preparation
- [ ] Code pushed to GitHub
- [ ] Environment variables documented
- [ ] amplify.yml file present
- [ ] next.config.ts optimized
- [ ] verify-aws-services.js script added

## Deployment ✅

### Amplify Setup
- [ ] Repository connected to Amplify
- [ ] Build settings configured (amplify.yml detected)
- [ ] Environment variables set:
  - [ ] TRUSTBITES_ACCESS_KEY_ID
  - [ ] TRUSTBITES_SECRET_ACCESS_KEY
  - [ ] TRUSTBITES_AWS_REGION (ap-southeast-1)
  - [ ] BEDROCK_REGION (us-east-1)
  - [ ] GOOGLE_MAPS_API_KEY
  - [ ] NEXTAUTH_SECRET
  - [ ] NEXTAUTH_URL
  - [ ] JWT_SECRET
  - [ ] All DynamoDB table names

### Deployment Process
- [ ] Initial deployment triggered
- [ ] Build logs reviewed for errors
- [ ] AWS services verification passed
- [ ] Application URL received
- [ ] NEXTAUTH_URL updated with production URL

## Post-Deployment ✅

### Functionality Testing
- [ ] App loads successfully
- [ ] Google Maps displays correctly
- [ ] Restaurant search works
- [ ] Restaurant markers appear on map
- [ ] Restaurant selection works
- [ ] AI analysis triggers successfully
- [ ] Reviews display with classifications
- [ ] Dashboard data loads
- [ ] Navigation between pages works

### AWS Services Testing
- [ ] DynamoDB tables created automatically
- [ ] Reviews saved to AnalyzedReviews table
- [ ] AI analysis using Bedrock Llama model
- [ ] No AWS permission errors in logs

### Performance & Security
- [ ] Page load times acceptable (<3s)
- [ ] Mobile responsiveness verified
- [ ] HTTPS working (Amplify default)
- [ ] Environment variables secure
- [ ] No sensitive data exposed in client

## Monitoring Setup ✅

### AWS CloudWatch
- [ ] Application logs monitored
- [ ] Error rates tracked
- [ ] API call metrics reviewed
- [ ] DynamoDB performance monitored

### Cost Management
- [ ] AWS Bedrock usage monitored
- [ ] DynamoDB read/write capacity optimized
- [ ] Google Maps API usage tracked
- [ ] Cost alerts configured

## Optional Enhancements ✅

### Custom Domain
- [ ] Domain purchased/configured
- [ ] SSL certificate setup
- [ ] DNS records configured
- [ ] Custom domain connected in Amplify

### Advanced Features
- [ ] CDN caching optimized
- [ ] Performance monitoring setup
- [ ] User analytics implemented
- [ ] Error tracking configured

## Production Readiness ✅

### Documentation
- [ ] API documentation updated
- [ ] Environment setup documented
- [ ] Troubleshooting guide available
- [ ] User guide created

### Backup & Recovery
- [ ] DynamoDB backup configured
- [ ] Code repository backup verified
- [ ] Environment variables backup secure
- [ ] Disaster recovery plan documented

---

## 🎯 Quick Verification Commands

Test locally before deployment:
```bash
# Verify AWS services
npm run verify-aws-setup

# Test build process
npm run build

# Check environment
npm run start
```

---

## 🚨 Emergency Contacts

- **AWS Support:** [AWS Support Center](https://console.aws.amazon.com/support/)
- **Amplify Docs:** [AWS Amplify Documentation](https://docs.aws.amazon.com/amplify/)
- **Google Maps Support:** [Google Maps Platform Support](https://developers.google.com/maps/support/)

---

**Deployment Date:** _________________  
**Deployed By:** _________________  
**Production URL:** _________________