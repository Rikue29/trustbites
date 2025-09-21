# Google Places API Setup Guide for TrustBites

## Step 1: Get Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - **Places API (New)**
   - **Places API**
   - **Maps JavaScript API**

4. Create credentials:
   - Go to "Credentials" in left sidebar
   - Click "Create Credentials" → "API Key"
   - Copy your API key

5. Restrict the API key (Important for security):
   - Click on your API key to edit
   - Under "API restrictions", select "Restrict key"
   - Choose: Places API (New), Places API

## Step 2: Add to Environment Variables

Add to your `.env.local`:
```
GOOGLE_PLACES_API_KEY=your_api_key_here
```

## Step 3: Test API Access

The Google Places API has a free tier:
- **100,000 requests per month FREE**
- Perfect for hackathon demonstration
- Each restaurant search + reviews = ~2-3 requests

## Pricing (if you exceed free tier):
- Place Search: $17/1000 requests
- Place Details: $17/1000 requests  
- Reviews are included in Place Details

For hackathon demo with ~10 restaurants = ~30 requests = **FREE**