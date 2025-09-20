import * as dotenv from "dotenv";
// Load environment variables
dotenv.config({ path: '.env.local' });
async function testAPI() {
    const baseUrl = 'http://localhost:3000';
    console.log('🧪 Testing TrustBites API...\n');
    try {
        // Test 1: Submit a review
        console.log('1️⃣ Testing review submission...');
        const submitResponse = await fetch(`${baseUrl}/api/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                restaurantId: 'restaurant-123',
                reviewText: 'This place is amazing! Best food ever! Perfect service! Highly recommend! Five stars!'
            }),
        });
        const submitResult = await submitResponse.json();
        console.log('✅ Submit Result:', JSON.stringify(submitResult, null, 2));
        // Test 2: Get all reviews
        console.log('\n2️⃣ Testing review retrieval...');
        const getResponse = await fetch(`${baseUrl}/api/reviews`);
        const getResult = await getResponse.json();
        console.log('✅ Get Result:', JSON.stringify(getResult, null, 2));
    }
    catch (error) {
        console.error('❌ Test failed:', error);
    }
}
testAPI();
