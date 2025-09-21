// Test frontend-backend connection
const testConnection = async () => {
  try {
    console.log('🔍 Testing API connection...');
    
    // Test reviews API
    const response = await fetch('http://localhost:3000/api/reviews');
    const data = await response.json();
    
    console.log('📊 API Response:', data);
    console.log('✅ Reviews found:', data.reviews?.length || 0);
    
    if (data.reviews && data.reviews.length > 0) {
      console.log('📝 Sample review:', data.reviews[0]);
    } else {
      console.log('❌ No reviews found - this is why your dashboard is empty');
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
};

// Run test
testConnection();