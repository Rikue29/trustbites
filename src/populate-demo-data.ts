import * as dotenv from "dotenv";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoClient } from "./lib/aws-config-compliant";
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config({ path: '.env.local' });

const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

async function populateDemoData() {
  console.log('🏗️ Populating DynamoDB with demo data for hackathon...\n');
  
  try {
    // 1. Create sample restaurants
    const restaurants = await createSampleRestaurants();
    console.log(`✅ Created ${restaurants.length} restaurants`);
    
    // 2. Create sample reviews for each restaurant
    let totalReviews = 0;
    for (const restaurant of restaurants) {
      const reviewCount = await createSampleReviews(restaurant.restaurantId, restaurant.name);
      totalReviews += reviewCount;
    }
    console.log(`✅ Created ${totalReviews} reviews`);
    
    // 3. Create analysis results
    const analysisCount = await createSampleAnalysisResults(restaurants);
    console.log(`✅ Created ${analysisCount} analysis results`);
    
    console.log('\n🎉 Demo data population completed!');
    console.log('\n📋 You can now view this data in AWS Console:');
    console.log('1. Go to AWS Console → DynamoDB → Tables');
    console.log('2. Check tables: Restaurants, Reviews, AnalysisResults');
    console.log('3. Click "Explore table items" to view the data');
    
  } catch (error) {
    console.error('❌ Error populating data:', error);
  }
}

async function createSampleRestaurants() {
  const restaurants = [
    {
      restaurantId: `rest_${uuidv4().replace(/-/g, '').substring(0, 8)}`,
      name: 'Village Park Restaurant',
      address: '5, Jalan SS 21/37, Damansara Utama, 47400 Petaling Jaya, Selangor',
      location: 'Petaling Jaya',
      cuisine: 'Malaysian',
      latitude: 3.1390,
      longitude: 101.6869,
      avgRating: 4.2,
      totalReviews: 0, // Will be updated
      lastScraped: new Date().toISOString(),
      googlePlaceId: 'ChIJ' + uuidv4().replace(/-/g, '').substring(0, 16)
    },
    {
      restaurantId: `rest_${uuidv4().replace(/-/g, '').substring(0, 8)}`,
      name: 'Jalan Alor Food Street',
      address: 'Jalan Alor, Bukit Bintang, 50200 Kuala Lumpur',
      location: 'Kuala Lumpur',
      cuisine: 'Street Food',
      latitude: 3.1459,
      longitude: 101.7065,
      avgRating: 4.0,
      totalReviews: 0,
      lastScraped: new Date().toISOString(),
      googlePlaceId: 'ChIJ' + uuidv4().replace(/-/g, '').substring(0, 16)
    },
    {
      restaurantId: `rest_${uuidv4().replace(/-/g, '').substring(0, 8)}`,
      name: 'Restoran Yut Kee',
      address: '35, Jalan Dang Wangi, 50100 Kuala Lumpur',
      location: 'Kuala Lumpur',
      cuisine: 'Hainanese',
      latitude: 3.1516,
      longitude: 101.6942,
      avgRating: 4.3,
      totalReviews: 0,
      lastScraped: new Date().toISOString(),
      googlePlaceId: 'ChIJ' + uuidv4().replace(/-/g, '').substring(0, 16)
    },
    {
      restaurantId: `rest_${uuidv4().replace(/-/g, '').substring(0, 8)}`,
      name: 'Hakka Restaurant',
      address: '24, Jalan Kia Peng, 50450 Kuala Lumpur',
      location: 'Kuala Lumpur',
      cuisine: 'Chinese',
      latitude: 3.1578,
      longitude: 101.7119,
      avgRating: 4.1,
      totalReviews: 0,
      lastScraped: new Date().toISOString(),
      googlePlaceId: 'ChIJ' + uuidv4().replace(/-/g, '').substring(0, 16)
    }
  ];
  
  for (const restaurant of restaurants) {
    await dynamoDocClient.send(new PutCommand({
      TableName: 'Restaurants',
      Item: restaurant
    }));
    console.log(`📍 Added restaurant: ${restaurant.name}`);
  }
  
  return restaurants;
}

async function createSampleReviews(restaurantId: string, restaurantName: string) {
  // Mix of English and Bahasa Melayu reviews
  const englishReviews = [
    { text: "Amazing food! The nasi lemak here is absolutely perfect. Highly recommend!", rating: 5, fake: true },
    { text: "Good food, reasonable prices. The chicken rice was decent.", rating: 4, fake: false },
    { text: "Excellent service and authentic flavors. Will definitely come back.", rating: 5, fake: false },
    { text: "Best restaurant ever! Perfect food! Outstanding service! Five stars!", rating: 5, fake: true },
    { text: "Average food quality. Nothing special but not bad either.", rating: 3, fake: false },
    { text: "Disappointing experience. Food was cold and service was slow.", rating: 2, fake: false },
    { text: "Great atmosphere and delicious local cuisine. Loved the char kway teow!", rating: 4, fake: false },
    { text: "Terrible place! Worst food ever! Never coming back! One star!", rating: 1, fake: true }
  ];
  
  const malayReviews = [
    { text: "Makanan di sini sangat sedap! Nasi lemak terbaik yang pernah saya makan.", rating: 5, fake: false },
    { text: "Tempat yang baik untuk makan dengan keluarga. Harga berpatutan.", rating: 4, fake: false },
    { text: "Restoran terbaik! Makanan hebat! Lima bintang! Sangat recommend!", rating: 5, fake: true },
    { text: "Makanan biasa sahaja. Tidak istimewa tapi boleh diterima.", rating: 3, fake: false },
    { text: "Pengalaman yang mengecewakan. Makanan tidak fresh dan lambat.", rating: 2, fake: false },
    { text: "Tempat yang selesa dengan citarasa autentik. Suka sangat!", rating: 4, fake: false }
  ];
  
  const allReviews = [...englishReviews, ...malayReviews];
  const reviewsToCreate = allReviews.slice(0, Math.min(10, allReviews.length)); // Limit to 10 reviews per restaurant
  
  for (const [index, reviewData] of reviewsToCreate.entries()) {
    const reviewId = `rev_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
    const isEnglish = englishReviews.some(r => r.text === reviewData.text);
    
    const review = {
      reviewId,
      restaurantId,
      authorName: `User${index + 1}`,
      reviewText: reviewData.text,
      rating: reviewData.rating,
      reviewDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Random date in last 30 days
      scrapedAt: new Date().toISOString(),
      language: isEnglish ? 'en' : 'ms',
      isFake: reviewData.fake ? 'true' : 'false',
      confidence: reviewData.fake ? 0.8 + Math.random() * 0.2 : 0.2 + Math.random() * 0.6, // Higher confidence for fake reviews
      sentiment: reviewData.rating >= 4 ? 'POSITIVE' : reviewData.rating <= 2 ? 'NEGATIVE' : 'NEUTRAL',
      sourceUrl: `https://maps.google.com/place/fake_place_id/review_${reviewId}`,
      comprehendAnalysis: {
        language: isEnglish ? 'en' : 'ms',
        sentiment: reviewData.rating >= 4 ? 'POSITIVE' : reviewData.rating <= 2 ? 'NEGATIVE' : 'NEUTRAL',
        keyPhrases: isEnglish ? ['food', 'service', 'restaurant'] : ['makanan', 'tempat', 'sedap'],
        analysisTimestamp: new Date().toISOString()
      }
    };
    
    await dynamoDocClient.send(new PutCommand({
      TableName: 'Reviews',
      Item: review
    }));
  }
  
  console.log(`📝 Added ${reviewsToCreate.length} reviews for ${restaurantName}`);
  return reviewsToCreate.length;
}

async function createSampleAnalysisResults(restaurants: any[]) {
  let analysisCount = 0;
  
  for (const restaurant of restaurants) {
    const analysisId = `analysis_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
    
    const analysisResult = {
      analysisId,
      restaurantId: restaurant.restaurantId,
      analysisDate: new Date().toISOString(),
      totalReviews: 10,
      fakeCount: Math.floor(Math.random() * 4) + 1, // 1-4 fake reviews
      fakePercentage: 0, // Will be calculated
      averageSentiment: 'POSITIVE',
      languageBreakdown: {
        en: Math.floor(Math.random() * 6) + 3, // 3-8 English reviews
        ms: Math.floor(Math.random() * 4) + 2   // 2-5 Malay reviews
      },
      confidenceDistribution: {
        high: Math.floor(Math.random() * 5) + 3,     // 3-7 high confidence
        medium: Math.floor(Math.random() * 3) + 2,   // 2-4 medium confidence  
        low: Math.floor(Math.random() * 2) + 1       // 1-2 low confidence
      },
      recommendations: [
        'Monitor reviews for suspicious patterns',
        'Encourage genuine customer feedback',
        'Respond to negative reviews professionally'
      ]
    };
    
    // Calculate fake percentage
    analysisResult.fakePercentage = Math.round((analysisResult.fakeCount / analysisResult.totalReviews) * 100);
    
    await dynamoDocClient.send(new PutCommand({
      TableName: 'AnalysisResults',
      Item: analysisResult
    }));
    
    console.log(`📊 Added analysis for ${restaurant.name}: ${analysisResult.fakePercentage}% fake reviews`);
    analysisCount++;
  }
  
  return analysisCount;
}

populateDemoData();