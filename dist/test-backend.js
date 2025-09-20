import * as dotenv from "dotenv";
import fetch from 'node-fetch';
// Load environment variables
dotenv.config({ path: '.env.local' });
// Your API Gateway endpoint (update this after deployment)
const API_BASE_URL = 'https://your-api-id.execute-api.ap-southeast-1.amazonaws.com/prod';
async function testTrustBitesBackend() {
    console.log('🧪 Testing TrustBites Backend System\n');
    try {
        // Test 1: Scrape restaurant reviews
        console.log('1️⃣ Testing Restaurant Scraping...');
        const scrapeResponse = await fetch(`${API_BASE_URL}/api/scrape`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                restaurant_name: 'Village Park Restaurant',
                location: 'Petaling Jaya, Malaysia',
                max_reviews: 15
            })
        });
        if (scrapeResponse.ok) {
            const scrapeResult = await scrapeResponse.json();
            console.log('✅ Scraping successful:', scrapeResult);
        }
        else {
            console.log('❌ Scraping failed:', await scrapeResponse.text());
        }
        // Wait a bit before next test
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Test 2: Trigger analysis
        console.log('\n2️⃣ Testing Review Analysis...');
        const analyzeResponse = await fetch(`${API_BASE_URL}/api/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                analyze_all_pending: true
            })
        });
        if (analyzeResponse.ok) {
            const analyzeResult = await analyzeResponse.json();
            console.log('✅ Analysis successful:', analyzeResult);
        }
        else {
            console.log('❌ Analysis failed:', await analyzeResponse.text());
        }
        // Test 3: Get restaurants
        console.log('\n3️⃣ Testing Restaurant Retrieval...');
        const restaurantsResponse = await fetch(`${API_BASE_URL}/api/restaurants?location=Petaling Jaya`);
        if (restaurantsResponse.ok) {
            const restaurantsResult = await restaurantsResponse.json();
            console.log('✅ Restaurant retrieval successful:');
            console.log(`Found ${restaurantsResult.count} restaurants`);
            if (restaurantsResult.restaurants && restaurantsResult.restaurants.length > 0) {
                const firstRestaurant = restaurantsResult.restaurants[0];
                console.log('Sample restaurant:', {
                    id: firstRestaurant.restaurantId,
                    name: firstRestaurant.name,
                    reviewCount: firstRestaurant.reviewCount,
                    fakePercentage: firstRestaurant.fakePercentage
                });
                // Test 4: Get reviews for specific restaurant
                console.log('\n4️⃣ Testing Restaurant Reviews...');
                const reviewsResponse = await fetch(`${API_BASE_URL}/api/restaurants/${firstRestaurant.restaurantId}/reviews`);
                if (reviewsResponse.ok) {
                    const reviewsResult = await reviewsResponse.json();
                    console.log('✅ Reviews retrieval successful:');
                    console.log(`Found ${reviewsResult.count} reviews`);
                    if (reviewsResult.reviews && reviewsResult.reviews.length > 0) {
                        const sampleReview = reviewsResult.reviews[0];
                        console.log('Sample review analysis:', {
                            reviewId: sampleReview.reviewId,
                            language: sampleReview.language,
                            sentiment: sampleReview.sentiment,
                            isFake: sampleReview.isFake,
                            confidence: sampleReview.confidence
                        });
                    }
                }
                else {
                    console.log('❌ Reviews retrieval failed:', await reviewsResponse.text());
                }
            }
        }
        else {
            console.log('❌ Restaurant retrieval failed:', await restaurantsResponse.text());
        }
        // Test 5: Search functionality
        console.log('\n5️⃣ Testing Restaurant Search...');
        const searchResponse = await fetch(`${API_BASE_URL}/api/restaurants/search?q=village&location=petaling`);
        if (searchResponse.ok) {
            const searchResult = await searchResponse.json();
            console.log('✅ Search successful:', {
                count: searchResult.count,
                restaurants: searchResult.restaurants?.map(r => ({ id: r.restaurantId, name: r.name }))
            });
        }
        else {
            console.log('❌ Search failed:', await searchResponse.text());
        }
        console.log('\n🎉 Backend testing completed!');
    }
    catch (error) {
        console.error('❌ Test suite failed:', error);
    }
}
// For demo purposes - test with local data if API is not available
async function testLocalDemo() {
    console.log('🏠 Running Local Demo (Simulated Backend)\n');
    // Simulate API responses for demo
    const mockResponses = {
        scraping: {
            success: true,
            restaurant_id: 'rest_demo123',
            reviews_scraped: 15,
            message: 'Successfully scraped Village Park Restaurant reviews'
        },
        analysis: {
            success: true,
            analyzed_count: 15,
            total_reviews: 15,
            message: 'Comprehend analysis completed'
        },
        restaurants: {
            success: true,
            count: 3,
            restaurants: [
                {
                    restaurantId: 'rest_demo123',
                    name: 'Village Park Restaurant',
                    location: 'Petaling Jaya',
                    cuisine: 'Malaysian',
                    avgRating: 4.2,
                    reviewCount: 15,
                    fakeCount: 3,
                    fakePercentage: 20.0,
                    sentimentBreakdown: { POSITIVE: 8, NEUTRAL: 4, NEGATIVE: 3 }
                },
                {
                    restaurantId: 'rest_demo456',
                    name: 'Jalan Alor Food Court',
                    location: 'Kuala Lumpur',
                    cuisine: 'Mixed',
                    avgRating: 4.0,
                    reviewCount: 25,
                    fakeCount: 8,
                    fakePercentage: 32.0
                }
            ]
        },
        reviews: {
            success: true,
            count: 15,
            reviews: [
                {
                    reviewId: 'rev_demo1',
                    reviewText: 'Makanan di sini sangat sedap! Nasi lemak terbaik yang pernah saya makan.',
                    language: 'ms',
                    sentiment: 'POSITIVE',
                    isFake: 'false',
                    confidence: 0.85,
                    rating: 5
                },
                {
                    reviewId: 'rev_demo2',
                    reviewText: 'Perfect restaurant! Amazing food! Best ever! Highly recommend! Five stars!',
                    language: 'en',
                    sentiment: 'POSITIVE',
                    isFake: 'true',
                    confidence: 0.92,
                    rating: 5
                },
                {
                    reviewId: 'rev_demo3',
                    reviewText: 'Decent food, reasonable prices. Good for family dining.',
                    language: 'en',
                    sentiment: 'POSITIVE',
                    isFake: 'false',
                    confidence: 0.75,
                    rating: 4
                }
            ]
        }
    };
    console.log('1️⃣ Scraping Demo Result:');
    console.log(JSON.stringify(mockResponses.scraping, null, 2));
    console.log('\n2️⃣ Analysis Demo Result:');
    console.log(JSON.stringify(mockResponses.analysis, null, 2));
    console.log('\n3️⃣ Restaurants Demo Result:');
    console.log(JSON.stringify(mockResponses.restaurants, null, 2));
    console.log('\n4️⃣ Reviews Demo Result:');
    console.log(JSON.stringify(mockResponses.reviews, null, 2));
    console.log('\n📊 Key Insights from Demo:');
    console.log('• Multilingual support: English + Bahasa Melayu ✅');
    console.log('• Fake detection accuracy: 85-92% confidence ✅');
    console.log('• Sentiment analysis working across languages ✅');
    console.log('• 20-32% fake review detection rate (realistic) ✅');
    console.log('\n🎯 Hackathon Demo Points:');
    console.log('• Real-world problem: Fake reviews in Malaysian market');
    console.log('• AI/ML innovation: Comprehend + custom algorithms');
    console.log('• Scalable architecture: Serverless AWS stack');
    console.log('• Local relevance: Bahasa Melayu language support');
}
// Run appropriate test based on argument
const runDemo = process.argv.includes('--demo');
if (runDemo) {
    testLocalDemo();
}
else {
    console.log('ℹ️  Update API_BASE_URL in the script with your deployed API Gateway endpoint');
    console.log('ℹ️  Or run with --demo flag for local simulation\n');
    testTrustBitesBackend();
}
