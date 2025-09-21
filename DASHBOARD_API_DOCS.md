# TrustBites API Documentation

## Overview
The TrustBites APIs provide comprehensive analytics, restaurant search, and real-time review fetching capabilities for the hackathon project.

All APIs return JSON responses with the following structure:
```json
{
  "success": boolean,
  "data": object,
  "error": string (only when success: false)
}
```

## Base URL
```
http://localhost:3000 (development)
```

## 🆕 NEW: Restaurant Search & Real-Time Reviews

### Search Restaurants by Location

**Endpoint:** `GET /api/restaurants/search`

**Description:** Search for restaurants in any location using Google Places API (perfect for Bukit Bintang, Kuala Lumpur!)

**Parameters:**
- `location` (required): Any location worldwide (e.g., "Times Square, New York", "Shibuya, Tokyo", "Oxford Street, London")
- `radius` (optional): Search radius in meters (default: 1000)
- `query` (optional): Additional search terms (default: "restaurant")

**Examples (Global Coverage):**
```
GET /api/restaurants/search?location=Times Square, New York&radius=1500
GET /api/restaurants/search?location=Shibuya, Tokyo
GET /api/restaurants/search?location=Oxford Street, London
GET /api/restaurants/search?location=Orchard Road, Singapore
GET /api/restaurants/search?location=Bukit Bintang, Kuala Lumpur
```

**Response:**
```json
{
  "success": true,
  "location": {
    "query": "Bukit Bintang, Kuala Lumpur",
    "coordinates": { "lat": 3.1467855, "lng": 101.7113043 }
  },
  "restaurants": [
    {
      "placeId": "ChIJkxdTEyw2zDERsy8XiwXjebY",
      "name": "Jogoya Japanese Buffet Restaurant",
      "address": "181, Bukit Bintang Road, Bukit Bintang, Kuala Lumpur",
      "location": { "lat": 3.146, "lng": 101.711 },
      "rating": 3.8,
      "totalReviews": 2946,
      "priceLevel": 3,
      "cuisine": "japanese_restaurant",
      "isOpen": true,
      "photos": [...]
    }
  ],
  "total": 20
}
```

### Get Real-Time Restaurant Reviews

**Endpoint:** `GET /api/restaurants/[placeId]`

**Description:** Fetch real-time restaurant details and reviews from Google Places API

**Parameters:**
- `placeId` (in URL): Google Places ID from search results

**Example:**
```
GET /api/restaurants/ChIJkxdTEyw2zDERsy8XiwXjebY
```

**Response:**
```json
{
  "success": true,
  "restaurant": {
    "placeId": "ChIJkxdTEyw2zDERsy8XiwXjebY",
    "name": "Jogoya Japanese Buffet Restaurant",
    "address": "181, Bukit Bintang Road...",
    "rating": 3.8,
    "totalReviews": 2946,
    "phone": "+60 3-2141 3168",
    "website": "http://jogoya.com.my",
    "openingHours": ["Monday: 6:00 PM – 10:30 PM", ...],
    "photos": [...]
  },
  "reviews": [
    {
      "reviewId": "google_1693526400_John_Doe",
      "restaurantPlaceId": "ChIJkxdTEyw2zDERsy8XiwXjebY",
      "authorName": "John Doe",
      "reviewText": "Great food and service...",
      "rating": 5,
      "reviewDate": "2024-08-31T16:00:00.000Z",
      "language": "en",
      "source": "google_places",
      "isFake": null,
      "confidence": null,
      "sentiment": null
    }
  ],
  "totalReviews": 5,
  "lastUpdated": "2025-09-21T10:30:00.000Z"
}
```

---

## 1. Dashboard Summary API

**Endpoint:** `GET /api/dashboard/summary`

**Description:** Get overall metrics and summary statistics for the dashboard.

**Parameters:** None

**Response:**
```json
{
  "success": true,
  "data": {
    "totalReviews": 35,
    "totalFakeReviews": 8,
    "fakeReviewPercentage": 22.9,
    "averageRating": 4.2,
    "recentReviewsCount": 15,
    "totalRestaurants": 7,
    "genuineReviewsCount": 27
  }
}
```

**Use Cases:**
- Main dashboard overview cards
- KPI displays
- Summary statistics

---

## 2. Recent Reviews API

**Endpoint:** `GET /api/dashboard/recent-reviews`

**Description:** Get the most recent reviews with filtering options.

**Parameters:**
- `limit` (optional): Number of reviews to return (default: 20)
- `filter` (optional): Filter reviews by type
  - `all` (default): All reviews
  - `fake`: Only fake reviews
  - `genuine`: Only genuine reviews

**Example:** `GET /api/dashboard/recent-reviews?limit=10&filter=fake`

**Response:**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "reviewId": "review-123",
        "reviewText": "Amazing food, best restaurant ever!",
        "rating": 5,
        "isFake": true,
        "confidence": 0.85,
        "reasons": ["excessive_positivity", "generic_praise"],
        "authorName": "John D.",
        "reviewDate": "2025-09-20T10:30:00Z",
        "restaurantId": "rest-456",
        "restaurant": {
          "name": "Nasi Lemak Paradise",
          "cuisine": "Malaysian",
          "location": "Kuala Lumpur"
        },
        "language": "en"
      }
    ],
    "total": 35,
    "filter": "fake",
    "limit": 10
  }
}
```

**Use Cases:**
- Recent reviews list
- Review monitoring
- Quick review assessment

---

## 3. Fake Review Insights API

**Endpoint:** `GET /api/dashboard/insights`

**Description:** Get detailed analysis of fake review patterns and insights.

**Parameters:** None

**Response:**
```json
{
  "success": true,
  "data": {
    "totalFakeReviews": 8,
    "commonReasons": [
      {
        "reason": "excessive_positivity",
        "count": 5,
        "percentage": "62.5"
      },
      {
        "reason": "generic_praise",
        "count": 3,
        "percentage": "37.5"
      }
    ],
    "languageBreakdown": [
      { "language": "en", "count": 6, "percentage": "75.0" },
      { "language": "ms", "count": 2, "percentage": "25.0" }
    ],
    "ratingDistribution": [
      { "rating": 5, "count": 6, "percentage": "75.0" },
      { "rating": 4, "count": 2, "percentage": "25.0" }
    ],
    "confidenceDistribution": [
      { "label": "Very High (90-100%)", "count": 2, "percentage": "25.0" },
      { "label": "High (80-90%)", "count": 4, "percentage": "50.0" },
      { "label": "Medium (70-80%)", "count": 2, "percentage": "25.0" }
    ],
    "topSuspiciousPatterns": [
      {
        "pattern": "excessive_positivity",
        "description": "Overly positive language",
        "count": 5,
        "percentage": "62.5"
      }
    ],
    "timePatterns": {
      "hourlyDistribution": [
        { "hour": 10, "count": 2 },
        { "hour": 14, "count": 3 }
      ],
      "dailyDistribution": [
        { "day": "Monday", "count": 2 },
        { "day": "Tuesday", "count": 1 }
      ]
    }
  }
}
```

**Use Cases:**
- Fake review analysis dashboard
- Pattern recognition displays
- Business intelligence insights

---

## 4. Trends Analytics API

**Endpoint:** `GET /api/dashboard/trends`

**Description:** Get time-series analytics and trends for ratings and fake review detection.

**Parameters:**
- `period` (optional): Number of days to analyze (default: 30)

**Example:** `GET /api/dashboard/trends?period=7`

**Response:**
```json
{
  "success": true,
  "data": {
    "period": 30,
    "totalReviews": 35,
    "ratingsOverTime": [
      {
        "date": "2025-09-01",
        "averageRating": 4.2,
        "reviewCount": 3
      },
      {
        "date": "2025-09-02",
        "averageRating": 4.5,
        "reviewCount": 2
      }
    ],
    "fakeReviewRatioOverTime": [
      {
        "date": "2025-09-01",
        "fakeReviewRatio": 20.5,
        "totalReviews": 3,
        "fakeReviews": 1
      }
    ],
    "volumeOverTime": [
      {
        "date": "2025-09-01",
        "reviewCount": 3
      }
    ],
    "averageRatingTrend": {
      "current": 4.2,
      "change": 0.15,
      "trend": "improving"
    },
    "detectionAccuracyTrend": {
      "averageConfidence": 0.832,
      "highConfidenceCount": 6,
      "change": 0.045,
      "trend": "improving"
    }
  }
}
```

**Use Cases:**
- Time-series charts
- Trend visualization
- Performance tracking

---

## Error Handling

All APIs use consistent error responses:

```json
{
  "success": false,
  "error": "Description of what went wrong"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `500`: Internal Server Error

---

## Data Models

### Review Object
```typescript
interface Review {
  reviewId: string;
  reviewText: string;
  rating: number;
  isFake: boolean;
  confidence?: number;
  reasons?: string[];
  authorName?: string;
  reviewDate: string;
  restaurantId: string;
  restaurant?: Restaurant;
  language: string;
}
```

### Restaurant Object
```typescript
interface Restaurant {
  restaurantId: string;
  name: string;
  cuisine: string;
  location: string;
  averageRating?: number;
  totalReviews?: number;
}
```

---

## Testing

Use the provided test script to validate all endpoints:

```bash
# Install dependencies
pip install requests

# Run tests (make sure Next.js server is running)
python test-dashboard-apis.py
```

---

## Rate Limiting

Currently no rate limiting is implemented. For production deployment, consider adding rate limiting middleware.

---

## Authentication

Currently no authentication is required. For production deployment with business owner login, add JWT token validation to all endpoints.

---

## Performance Notes

- All APIs use DynamoDB scans which may be slow with large datasets
- Consider implementing pagination for large result sets
- Response times typically under 500ms for current dataset size
- APIs are optimized for datasets up to 10,000 reviews

---

## Integration Examples

### JavaScript/React Example
```javascript
// Fetch dashboard summary
const fetchDashboardSummary = async () => {
  try {
    const response = await fetch('/api/dashboard/summary');
    const data = await response.json();
    
    if (data.success) {
      console.log('Total Reviews:', data.data.totalReviews);
      console.log('Fake Reviews:', data.data.totalFakeReviews);
    } else {
      console.error('API Error:', data.error);
    }
  } catch (error) {
    console.error('Network Error:', error);
  }
};

// Fetch recent reviews with filter
const fetchRecentReviews = async (filter = 'all', limit = 20) => {
  try {
    const response = await fetch(
      `/api/dashboard/recent-reviews?filter=${filter}&limit=${limit}`
    );
    const data = await response.json();
    
    if (data.success) {
      return data.data.reviews;
    }
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
};
```

### Python Example
```python
import requests

def get_dashboard_insights():
    response = requests.get('http://localhost:3000/api/dashboard/insights')
    
    if response.status_code == 200:
        data = response.json()
        if data['success']:
            return data['data']
    
    return None
```

---

## Contact

For questions about the API implementation, contact the backend team.
For UI implementation questions, contact the frontend team.