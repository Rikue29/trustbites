# TrustBites AI Model Integration Guide

## 🤝 Backend + AI Model Integration Checklist

### 📋 **Data Contract (Critical)**

Your backend provides this **exact structure** to the AI model:

```json
{
  "reviewId": "uuid-string",
  "reviewText": "The actual review content...",
  "rating": 4,
  "language": "en" | "ms",
  "authorName": "Customer Name",
  "reviewDate": "2025-09-20T10:30:00Z",
  "restaurantId": "uuid-string"
}
```

Your AI model should return this **exact structure**:

```json
{
  "reviewId": "same-uuid-string",
  "isFake": true | false,
  "confidence": 0.85,
  "reasons": ["Generic language", "Too positive"],
  "aiModel": "trustbites-detector-v1",
  "aiVersion": "1.0"
}
```

### 🔌 **Integration Points**

1. **API Endpoint for AI Processing**
2. **Database Update Functions**  
3. **Batch Processing Pipeline**
4. **Real-time Analysis Hook**

### ⚠️ **Critical Things to Align**

#### **1. Data Types & Formats**
- ✅ **Language codes**: "en", "ms" (not "english", "malay")
- ✅ **Confidence scores**: 0.0-1.0 (not percentages)
- ✅ **Boolean values**: true/false (not "true"/"false" strings)
- ✅ **Dates**: ISO format (2025-09-20T10:30:00Z)

#### **2. Review Processing Order**
- ✅ **New reviews**: Start with `isFake: "pending"`
- ✅ **AI processes**: Updates to `isFake: true/false`
- ✅ **Confidence threshold**: Agree on minimum (e.g., 0.7)

#### **3. Error Handling**
- ✅ **Failed AI analysis**: Keep as "pending", don't crash
- ✅ **Timeout handling**: Set reasonable limits (30s?)
- ✅ **Batch size**: How many reviews to process at once?

#### **4. Performance Considerations**
- ✅ **Processing time**: How long per review?
- ✅ **Memory usage**: Can handle 35+ reviews?
- ✅ **Regional deployment**: Malaysia region compatible?

### 🧪 **Testing Strategy**

#### **Phase 1: Individual Testing**
- [ ] Your backend: API endpoints work
- [ ] Their AI: Model makes predictions
- [ ] Data format: JSON matches exactly

#### **Phase 2: Integration Testing**  
- [ ] End-to-end: Review → AI → Database update
- [ ] Error cases: Invalid data, timeouts
- [ ] Performance: Batch processing speed

#### **Phase 3: Demo Preparation**
- [ ] Live demo: Real reviews get analyzed
- [ ] Backup plan: Pre-computed results ready
- [ ] Story flow: Show before/after AI analysis

### 🚀 **Deployment Options**

#### **Option A: AI as Microservice** (Recommended)
```
Your Backend ↔ HTTP API ↔ AI Model Service
```
- ✅ Independent scaling
- ✅ Language flexibility (Python AI + Node.js backend)
- ✅ Easy testing

#### **Option B: AI as Lambda Function**
```
Your Backend ↔ AWS Lambda ↔ AI Model
```
- ✅ Serverless scaling
- ✅ Cost efficient
- ✅ AWS ecosystem integration

#### **Option C: Direct Integration**
```
Your Backend → AI Model (same process)
```
- ✅ Simplest for hackathon
- ❌ Language compatibility issues

### 📝 **Communication Protocol**

#### **What Your Friend Needs From You:**
1. **Sample data file**: Export 10-20 reviews as JSON
2. **API endpoint**: Where to send AI results
3. **Database schema**: Review table structure
4. **Error handling**: What to do when things fail

#### **What You Need From Your Friend:**
1. **Model interface**: How to call their AI function
2. **Processing time**: How long per review/batch
3. **Resource requirements**: Memory, CPU needs
4. **Confidence interpretation**: What scores mean

### 🛠️ **Integration Code Templates**

I'll create these for you:
- API endpoint for AI processing
- Database update functions
- Error handling middleware
- Testing utilities

### 📊 **Demo Flow Planning**

#### **Hackathon Presentation Structure:**
1. **Show raw data**: "Here are real Google Maps reviews"
2. **Run AI analysis**: "Let's detect fake reviews"
3. **Display results**: "AI found X% fake with Y confidence"
4. **Explain insights**: "These patterns indicate fake reviews"

#### **Backup Plans:**
- Pre-computed AI results ready
- Demo dataset prepared
- Screenshots of working system

Would you like me to create the actual integration code templates next?