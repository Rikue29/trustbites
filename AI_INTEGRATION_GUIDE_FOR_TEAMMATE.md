# 🍽️ TrustBites: AI-Powered Fake Review Detection System

## 🎯 **What TrustBites Does**
**TrustBites is a comprehensive platform that helps consumers identify trustworthy restaurants by detecting fake reviews using AI analysis.**

---

## 🌟 **Consumer-Facing Features Built**

### 🌍 **1. Global Restaurant Search**
**API**: `GET /api/restaurants/search`

**What it does:**
- Search restaurants **anywhere in the world**
- Real-time data from Google Places API
- Supports any location (KL, Singapore, Tokyo, New York, etc.)

**Example Usage:**
```
GET /api/restaurants/search?location=Kuala Lumpur,Malaysia&radius=5000
```

### Step 3: Install Python Dependencies
```bash
pip install boto3 python-dotenv
```

## 🎯 Integration Points

### Primary File: `src/ai-integration.ts`

This file contains the integration framework. You need to replace the mock AI function with your real model.

### Data Contract

**Input to your model:**
```typescript
interface ReviewForAI {
  reviewId: string;
  reviewText: string;
  rating: number;
  language: string;  // 'en' or 'ms' (Malay)
  authorName: string;
  reviewDate: string;
  restaurantId: string;
}
```

**Expected output from your model:**
```typescript
interface AIAnalysisResult {
  reviewId: string;
  isFake: boolean;
  confidence: number;  // 0.0 to 1.0
  reasons: string[];   // Why it's flagged as fake
  aiModel: string;     // Your model name
  aiVersion: string;   // Your model version
}
```

## 🔧 Implementation Steps

### 1. Replace Mock Function

In `src/ai-integration.ts`, find this mock function and replace it:

```typescript
// REPLACE THIS MOCK FUNCTION
async function callFakeReviewDetectionAI(review: ReviewForAI): Promise<AIAnalysisResult> {
  // TODO: Replace with your actual AI model call
  
  // Your implementation here:
  // 1. Load your trained model
  // 2. Preprocess the review text
  // 3. Run inference
  // 4. Return structured result
  
  const result = await yourModelInference(review.reviewText, review.language);
  
  return {
    reviewId: review.reviewId,
    isFake: result.is_fake,
    confidence: result.confidence,
    reasons: result.detection_reasons,
    aiModel: "YourModelName",
    aiVersion: "v1.0"
  };
}
```

### 2. Model Integration Options

**Option A: Python Model via Child Process**
```typescript
import { spawn } from 'child_process';

async function callPythonModel(reviewText: string, language: string) {
  return new Promise((resolve, reject) => {
    const python = spawn('python', ['your-model-script.py', reviewText, language]);
    
    python.stdout.on('data', (data) => {
      const result = JSON.parse(data.toString());
      resolve(result);
    });
    
    python.stderr.on('data', (data) => {
      reject(new Error(data.toString()));
    });
  });
}
```

**Option B: REST API Call**
```typescript
async function callModelAPI(reviewText: string, language: string) {
  const response = await fetch('http://your-model-api/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: reviewText, language })
  });
  
  return await response.json();
}
```

**Option C: Direct JavaScript/Node.js Integration**
```typescript
// If you have a JavaScript/ONNX version of your model
import * as ort from 'onnxruntime-node';

async function runONNXModel(reviewText: string) {
  const session = await ort.InferenceSession.create('your-model.onnx');
  // Your inference logic here
}
```

## 📊 Sample Data Available

You have **35 real Malaysian restaurant reviews** to test with:
- 7 restaurants (Nasi Lemak, Roti Canai, etc.)
- English and Bahasa Melayu reviews
- Various rating levels (1-5 stars)

## 🧪 Testing Your Integration

### Test with Real Data
```bash
# Run the integration on existing reviews
node src/ai-integration.js

# Test dashboard APIs
python test-dashboard-apis.py

# Start the development server
npm run dev
```

### Verify Results
Visit `http://localhost:3000/api/dashboard/summary` to see your AI analysis results.

## 🛠️ Integration Workflow

1. **Replace mock function** with your model
2. **Test on sample reviews** (35 Malaysian reviews available)
3. **Verify dashboard APIs** return your analysis
4. **Check confidence scores** and reasons
5. **Optimize performance** if needed

## 📝 Example Implementation Template

```typescript
// src/ai-model.ts (create this file)
export async function detectFakeReview(reviewText: string, language: string) {
  try {
    // 1. Preprocess text
    const cleanText = preprocessText(reviewText);
    
    // 2. Feature extraction
    const features = extractFeatures(cleanText, language);
    
    // 3. Model inference
    const prediction = await runYourModel(features);
    
    // 4. Generate explanations
    const reasons = generateReasons(prediction, features);
    
    return {
      isFake: prediction.probability > 0.5,
      confidence: prediction.probability,
      reasons: reasons,
      aiModel: "YourModelName",
      aiVersion: "v1.0"
    };
  } catch (error) {
    console.error('AI model error:', error);
    return {
      isFake: false,
      confidence: 0.0,
      reasons: ['Error in AI analysis'],
      aiModel: "YourModelName",
      aiVersion: "v1.0"
    };
  }
}
```

## 🚨 Important Notes

- **Performance**: Dashboard should load quickly, optimize model inference
- **Error Handling**: Always provide fallback responses
- **Multilingual**: Support both English and Bahasa Melayu
- **Confidence Scores**: Use meaningful 0.0-1.0 scale
- **Reasons**: Provide human-readable explanations

## 🎯 Success Criteria

✅ Dashboard shows real AI analysis (not mock data)
✅ Confidence scores reflect actual model certainty  
✅ Reasons explain why reviews are flagged
✅ Both English and Malay reviews processed
✅ APIs respond quickly (< 2 seconds)

## 🆘 Need Help?

- Check `test-dashboard-apis.py` for API testing
- Review `src/ai-integration.ts` for data structures
- Malaysian restaurant data is already in DynamoDB
- Dashboard APIs are at `/api/dashboard/*`

## 🏆 Ready for Demo!

Once integrated, you'll have:
- Real AI-powered fake review detection
- Business owner dashboard with your insights
- Professional demo showing Malaysian restaurant analysis

**Good luck with the integration!** 🚀

---
*This integration framework was built to make your life easy. Focus on your model - we've handled the infrastructure!*