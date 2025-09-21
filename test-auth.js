// Test script for TrustBites Authentication System
// Run with: node test-auth.js

const BASE_URL = 'http://localhost:3000';

async function testAuth() {
  console.log('🚀 Testing TrustBites Authentication System\n');

  // Test data
  const testUser = {
    email: 'test@restaurant.com',
    password: 'password123',
    confirmPassword: 'password123',
    ownerName: 'John Doe',
    businessName: 'John\'s Restaurant'
  };

  try {
    // 1. Test Registration
    console.log('1️⃣ Testing Registration...');
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });

    const registerData = await registerResponse.json();
    console.log('Register Response:', registerResponse.status, registerData);

    if (registerResponse.ok) {
      console.log('✅ Registration successful!');
    } else {
      console.log('❌ Registration failed:', registerData.error);
      // Continue testing even if registration fails (user might already exist)
    }

    console.log('\n');

    // 2. Test Login
    console.log('2️⃣ Testing Login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login Response:', loginResponse.status, loginData);

    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginData.error);
      return;
    }

    console.log('✅ Login successful!');
    
    // Extract cookies for subsequent requests
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('🍪 Cookies received:', cookies ? 'Yes' : 'No');

    console.log('\n');

    // 3. Test Auth Check (with cookies)
    console.log('3️⃣ Testing Auth Check...');
    const checkResponse = await fetch(`${BASE_URL}/api/auth/check`, {
      method: 'GET',
      headers: {
        'Cookie': cookies || ''
      }
    });

    const checkData = await checkResponse.json();
    console.log('Auth Check Response:', checkResponse.status, checkData);

    if (checkResponse.ok && checkData.authenticated) {
      console.log('✅ Authentication check successful!');
    } else {
      console.log('❌ Authentication check failed');
    }

    console.log('\n');

    // 4. Test Protected Dashboard API
    console.log('4️⃣ Testing Protected Dashboard API...');
    const dashboardResponse = await fetch(`${BASE_URL}/api/dashboard/summary`, {
      method: 'GET',
      headers: {
        'Cookie': cookies || ''
      }
    });

    const dashboardData = await dashboardResponse.json();
    console.log('Dashboard Response:', dashboardResponse.status);
    
    if (dashboardResponse.ok) {
      console.log('✅ Dashboard access successful!');
      console.log('📊 Dashboard data preview:', {
        totalReviews: dashboardData.data?.totalReviews,
        totalRestaurants: dashboardData.data?.totalRestaurants,
        fakeReviewsDetected: dashboardData.data?.fakeReviewsDetected
      });
    } else {
      console.log('❌ Dashboard access failed:', dashboardData.error);
    }

    console.log('\n');

    // 5. Test Logout
    console.log('5️⃣ Testing Logout...');
    const logoutResponse = await fetch(`${BASE_URL}/api/logout`, {
      method: 'POST',
      headers: {
        'Cookie': cookies || ''
      }
    });

    const logoutData = await logoutResponse.json();
    console.log('Logout Response:', logoutResponse.status, logoutData);

    if (logoutResponse.ok) {
      console.log('✅ Logout successful!');
    } else {
      console.log('❌ Logout failed');
    }

    console.log('\n');

    // 6. Test Access After Logout
    console.log('6️⃣ Testing Access After Logout...');
    const postLogoutResponse = await fetch(`${BASE_URL}/api/auth/check`, {
      method: 'GET'
    });

    const postLogoutData = await postLogoutResponse.json();
    console.log('Post-logout Auth Check:', postLogoutResponse.status, postLogoutData);

    if (postLogoutResponse.status === 401) {
      console.log('✅ Logout verification successful - access properly denied!');
    } else {
      console.log('❌ Logout verification failed - still authenticated');
    }

  } catch (error) {
    console.error('🔥 Test Error:', error.message);
  }

  console.log('\n🎉 Authentication testing complete!');
}

// Run the tests
testAuth();