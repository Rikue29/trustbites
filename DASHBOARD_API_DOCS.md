# TrustBites Dashboard API Documentation

## Overview
The TrustBites Dashboard APIs provide comprehensive analytics and insights for business owners to monitor their restaurant reviews and detect fake reviews.

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