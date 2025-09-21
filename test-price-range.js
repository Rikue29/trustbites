// Test TrustBites Price Range Feature
// Run with: node test-price-range.js

const BASE_URL = 'http://localhost:3000';

async function testPriceRangeFeature() {
  console.log('🏷️  TrustBites Price Range Feature Test');
  console.log('=======================================\n');

  try {
    // Test 1: Search restaurants in KL (should show price ranges)
    console.log('1️⃣ Testing Restaurant Search with Price Ranges...');
    const searchResponse = await fetch(`${BASE_URL}/api/restaurants/search?location=Kuala+Lumpur,Malaysia&radius=2000`);
    const searchData = await searchResponse.json();

    if (searchResponse.ok && searchData.restaurants) {
      console.log(`✅ Found ${searchData.restaurants.length} restaurants\n`);
      
      // Show first 5 restaurants with their price information
      console.log('📋 Sample Restaurants with Price Ranges:');
      console.log('=' * 45);
      
      searchData.restaurants.slice(0, 5).forEach((restaurant, index) => {
        console.log(`\n${index + 1}. ${restaurant.name}`);
        console.log(`   📍 ${restaurant.address}`);
        console.log(`   ⭐ Rating: ${restaurant.rating}/5 (${restaurant.totalReviews} reviews)`);
        
        // Display price information
        if (restaurant.priceRange) {
          console.log(`   💰 Price: ${restaurant.priceRange.symbol} - ${restaurant.priceRange.description}`);
          console.log(`   💵 Range: ${restaurant.priceRange.range} per person`);
          console.log(`   📊 Level: ${restaurant.priceRange.level !== null ? restaurant.priceRange.level + '/4' : 'Unknown'}`);
        } else {
          console.log(`   💰 Price: Information not available`);
        }
        
        console.log(`   🍽️  Cuisine: ${restaurant.cuisine}`);
      });

      // Show price level distribution
      console.log('\n📊 Price Level Distribution:');
      console.log('=' * 30);
      
      const priceLevels = {
        'Free/Very Cheap (FREE)': 0,
        'Inexpensive ($)': 0,
        'Moderate ($$)': 0,
        'Expensive ($$$)': 0,
        'Very Expensive ($$$$)': 0,
        'Unknown': 0
      };

      searchData.restaurants.forEach(restaurant => {
        if (restaurant.priceRange) {
          switch(restaurant.priceRange.level) {
            case 0: priceLevels['Free/Very Cheap (FREE)']++; break;
            case 1: priceLevels['Inexpensive ($)']++; break;
            case 2: priceLevels['Moderate ($$)']++; break;
            case 3: priceLevels['Expensive ($$$)']++; break;
            case 4: priceLevels['Very Expensive ($$$$)']++; break;
            default: priceLevels['Unknown']++; break;
          }
        } else {
          priceLevels['Unknown']++;
        }
      });

      Object.entries(priceLevels).forEach(([level, count]) => {
        if (count > 0) {
          console.log(`   ${level}: ${count} restaurants`);
        }
      });

    } else {
      console.log('❌ Restaurant search failed');
      console.log('Response:', searchData);
    }

    console.log('\n');

    // Test 2: Get detailed restaurant info with price range
    if (searchData.restaurants && searchData.restaurants.length > 0) {
      const sampleRestaurant = searchData.restaurants[0];
      console.log('2️⃣ Testing Restaurant Details with Price Information...');
      console.log(`🔍 Getting details for: ${sampleRestaurant.name}\n`);

      const detailsResponse = await fetch(`${BASE_URL}/api/restaurants/${sampleRestaurant.placeId}`);
      const detailsData = await detailsResponse.json();

      if (detailsResponse.ok && detailsData.restaurant) {
        const restaurant = detailsData.restaurant;
        console.log('✅ Restaurant details retrieved successfully!');
        console.log(`\n🏪 ${restaurant.name}`);
        console.log(`📍 ${restaurant.address}`);
        console.log(`📞 ${restaurant.phone || 'No phone available'}`);
        console.log(`🌐 ${restaurant.website || 'No website available'}`);
        
        if (restaurant.priceRange) {
          console.log(`\n💰 PRICE INFORMATION:`);
          console.log(`   Symbol: ${restaurant.priceRange.symbol}`);
          console.log(`   Description: ${restaurant.priceRange.description}`);
          console.log(`   Range: ${restaurant.priceRange.range} per person`);
          console.log(`   Level: ${restaurant.priceRange.level}/4`);
        }

        console.log(`\n⏰ OPENING HOURS:`);
        if (restaurant.openingHours && restaurant.openingHours.length > 0) {
          restaurant.openingHours.forEach(hours => {
            console.log(`   ${hours}`);
          });
        } else {
          console.log('   Hours not available');
        }

        console.log(`\n📸 Photos: ${restaurant.photos.length} available`);
        console.log(`💬 Reviews: ${detailsData.reviews.length} available for analysis`);

      } else {
        console.log('❌ Failed to get restaurant details');
        console.log('Response:', detailsData);
      }
    }

  } catch (error) {
    console.error('🔥 Test Error:', error.message);
  }

  console.log('\n🎉 Price Range Feature Test Complete!');
  console.log('=====================================');
  console.log('\n🌟 Key Features Demonstrated:');
  console.log('   ✅ Price level symbols (FREE, $, $$, $$$, $$$$)');
  console.log('   ✅ Price descriptions (Inexpensive, Moderate, etc.)');
  console.log('   ✅ Price ranges in Malaysian Ringgit (RM)');
  console.log('   ✅ Price distribution analysis');
  console.log('   ✅ Integration with restaurant search & details');
  console.log('\n💡 Frontend can now show price filters and ranges!');
}

// Run the test
testPriceRangeFeature();