// TrustBites Authentication System Test
// Run this with: node test-auth-comprehensive.js

const API_BASE = 'http://localhost:3000/api';

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', data = null, cookies = '') {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    }
  };

  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const result = await response.json();
    
    // Extract cookies from response
    const setCookies = response.headers.get('set-cookie') || '';
    
    return {
      status: response.status,
      data: result,
      cookies: setCookies
    };
  } catch (error) {
    console.error(`❌ Error calling ${endpoint}:`, error.message);
    return { status: 500, data: { error: error.message }, cookies: '' };
  }
}

// Test data
const testBusinessOwner = {
  email: 'test@trustbites.com',
  password: 'SecurePassword123',
  confirmPassword: 'SecurePassword123',
  ownerName: 'John Doe',
  businessName: 'John\'s Restaurant'
};

async function runAuthenticationTests() {
  console.log('🚀 TrustBites Authentication System Test');
  console.log('==========================================\n');

  let authCookies = '';

  // Test 1: Registration
  console.log('1️⃣ Testing Registration...');
  const registerResult = await apiCall('/auth/register', 'POST', testBusinessOwner);
  console.log(`Status: ${registerResult.status}`);
  console.log('Response:', registerResult.data);
  
  if (registerResult.status === 201 || registerResult.status === 200) {
    console.log('✅ Registration successful!\n');
  } else if (registerResult.status === 400 && registerResult.data.error?.includes('already exists')) {
    console.log('ℹ️ Account already exists (that\'s okay for testing)\n');
  } else {
    console.log('❌ Registration failed\n');
  }

  // Test 2: Login
  console.log('2️⃣ Testing Login...');
  const loginResult = await apiCall('/auth/login', 'POST', {
    email: testBusinessOwner.email,
    password: testBusinessOwner.password
  });
  console.log(`Status: ${loginResult.status}`);
  console.log('Response:', loginResult.data);
  
  if (loginResult.status === 200) {
    authCookies = loginResult.cookies;
    console.log('✅ Login successful!');
    console.log('🍪 Auth cookie received\n');
  } else {
    console.log('❌ Login failed\n');
    return;
  }

  // Test 3: Check Authentication Status
  console.log('3️⃣ Testing Auth Check...');
  const authCheckResult = await apiCall('/auth/check', 'GET', null, authCookies);
  console.log(`Status: ${authCheckResult.status}`);
  console.log('Response:', authCheckResult.data);
  
  if (authCheckResult.status === 200) {
    console.log('✅ Auth check successful!\n');
  } else {
    console.log('❌ Auth check failed\n');
  }

  // Test 4: Access Protected Dashboard API
  console.log('4️⃣ Testing Protected Dashboard API...');
  const dashboardResult = await apiCall('/dashboard/summary', 'GET', null, authCookies);
  console.log(`Status: ${dashboardResult.status}`);
  
  if (dashboardResult.status === 200) {
    console.log('✅ Dashboard access successful!');
    console.log('Dashboard data keys:', Object.keys(dashboardResult.data));
  } else {
    console.log('❌ Dashboard access failed');
    console.log('Response:', dashboardResult.data);
  }
  console.log('');

  // Test 5: Access Dashboard Without Auth
  console.log('5️⃣ Testing Dashboard Without Authentication...');
  const unauthedResult = await apiCall('/dashboard/summary', 'GET');
  console.log(`Status: ${unauthedResult.status}`);
  console.log('Response:', unauthedResult.data);
  
  if (unauthedResult.status === 401) {
    console.log('✅ Dashboard properly protected!\n');
  } else {
    console.log('❌ Dashboard should require authentication\n');
  }

  // Test 6: Logout
  console.log('6️⃣ Testing Logout...');
  const logoutResult = await apiCall('/auth/logout', 'POST', null, authCookies);
  console.log(`Status: ${logoutResult.status}`);
  console.log('Response:', logoutResult.data);
  
  if (logoutResult.status === 200) {
    console.log('✅ Logout successful!\n');
  } else {
    console.log('❌ Logout failed\n');
  }

  // Test 7: Try Dashboard After Logout
  console.log('7️⃣ Testing Dashboard After Logout...');
  const postLogoutResult = await apiCall('/dashboard/summary', 'GET', null, authCookies);
  console.log(`Status: ${postLogoutResult.status}`);
  
  if (postLogoutResult.status === 401) {
    console.log('✅ Dashboard properly requires re-authentication after logout!\n');
  } else {
    console.log('❌ Dashboard should require re-authentication after logout\n');
  }

  console.log('🎉 Authentication System Test Complete!');
  console.log('==========================================');
}

// Global Restaurant Search Test (bonus)
async function testGlobalSearch() {
  console.log('\n🌍 Bonus: Testing Global Restaurant Search...');
  
  const searchResult = await apiCall('/restaurants/search?location=Kuala Lumpur, Malaysia&radius=5000');
  console.log(`Status: ${searchResult.status}`);
  
  if (searchResult.status === 200) {
    console.log('✅ Global search working!');
    console.log(`Found ${searchResult.data.restaurants?.length || 0} restaurants in KL`);
  } else {
    console.log('❌ Global search failed');
    console.log('Response:', searchResult.data);
  }
}

// Run all tests
async function main() {
  try {
    await runAuthenticationTests();
    await testGlobalSearch();
  } catch (error) {
    console.error('❌ Test runner error:', error);
  }
}

main();