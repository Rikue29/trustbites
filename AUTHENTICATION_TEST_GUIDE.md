# 🚀 TrustBites Authentication Testing Guide

## Prerequisites
✅ Next.js server running on http://localhost:3000
✅ Malaysia region (ap-southeast-5) configured 
✅ BusinessOwners table created in DynamoDB

## 🧪 Testing Steps

### 1. Start the Server
```bash
npm run dev
```
Wait for "✓ Ready" message

### 2. Test with REST Client (Postman/Insomnia) or Browser DevTools

#### 🔐 Registration Test
**POST** `http://localhost:3000/api/auth/register`
```json
{
  "email": "hackathon@trustbites.com",
  "password": "Malaysia2025!",
  "confirmPassword": "Malaysia2025!",
  "ownerName": "Hackathon Demo",
  "businessName": "TrustBites Demo Restaurant"
}
```
**Expected**: 200 OK with user data

#### 🔑 Login Test  
**POST** `http://localhost:3000/api/auth/login`
```json
{
  "email": "hackathon@trustbites.com", 
  "password": "Malaysia2025!"
}
```
**Expected**: 200 OK + auth cookie set

#### ✅ Auth Check Test
**GET** `http://localhost:3000/api/auth/check`
**Expected**: 200 OK with user info (if logged in)

#### 🏢 Protected Dashboard Test
**GET** `http://localhost:3000/api/dashboard/summary`
**Expected**: 
- ✅ 200 OK (if authenticated)
- ❌ 401 Unauthorized (if not authenticated)

#### 🚪 Logout Test
**POST** `http://localhost:3000/api/auth/logout`
**Expected**: 200 OK + cookie cleared

### 3. Test Global Restaurant Search (Bonus)
**GET** `http://localhost:3000/api/restaurants/search?location=Kuala Lumpur, Malaysia&radius=5000`
**Expected**: 200 OK with KL restaurants

## 🌟 Key Features Demonstrated

### 🔒 Security Features
- ✅ Password hashing (bcrypt, 12 rounds)
- ✅ JWT tokens (7-day expiry)
- ✅ HttpOnly cookies (XSS protection)
- ✅ Input validation
- ✅ Protected routes

### 🏗️ Architecture
- ✅ Malaysia region prioritized (ap-southeast-5)
- ✅ DynamoDB with proper indexes
- ✅ RESTful API design
- ✅ Error handling
- ✅ TypeScript type safety

### 🎯 Hackathon-Ready Features
- ✅ Complete business owner auth system
- ✅ Protected dashboard APIs
- ✅ Global restaurant search
- ✅ Real-time Google Reviews integration
- ✅ Production-ready security

## 🚨 Troubleshooting

### Server won't start?
- Check port 3000 is free
- Verify .env.local has correct AWS credentials
- Run `npm install` if packages missing

### Authentication fails?
- Verify BusinessOwners table exists in DynamoDB
- Check AWS credentials and region
- Ensure cookies are enabled in client

### Database errors?
- Confirm ap-southeast-5 region is available
- Check AWS credentials have DynamoDB permissions
- Verify table indexes are created properly

## 🎉 Success Criteria
- ✅ Register new business owner
- ✅ Login successfully  
- ✅ Access protected dashboard
- ✅ Logout clears session
- ✅ Unauthenticated requests blocked

Your TrustBites authentication system is **HACKATHON READY**! 🇲🇾