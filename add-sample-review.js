// Add a sample review to test the system
const addSampleReview = async () => {
  try {
    console.log('📝 Adding sample review...');
    
    const reviewData = {
      restaurantId: 'test-restaurant-123',
      reviewText: 'Great food and excellent service! The pasta was delicious and the staff was very friendly.'
    };
    
    const response = await fetch('http://localhost:3000/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reviewData)
    });
    
    const result = await response.json();
    console.log('✅ Review added:', result);
    
    // Now test if we can fetch it back
    const fetchResponse = await fetch('http://localhost:3000/api/reviews');
    const fetchData = await fetchResponse.json();
    console.log('📊 Total reviews now:', fetchData.reviews?.length || 0);
    
  } catch (error) {
    console.error('❌ Failed to add review:', error.message);
  }
};

addSampleReview();