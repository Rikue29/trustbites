/**
 * Debug Production Environment Variables
 * This script helps you verify what environment variables are available in production
 */

console.log('🔍 Debugging Production Environment Variables...\n');

// Check all required environment variables
const requiredVars = [
  'GOOGLE_PLACES_API_KEY',
  'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
  'TRUSTBITES_AWS_REGION',
  'TRUSTBITES_AWS_ACCESS_KEY_ID',
  'TRUSTBITES_AWS_SECRET_ACCESS_KEY',
  'TRUSTBITES_BEDROCK_REGION'
];

console.log('📋 Required Environment Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const display = value ? `${value.substring(0, 10)}...` : 'NOT SET';
  console.log(`${status} ${varName}: ${display}`);
});

console.log('\n🌐 Client-side Environment Variables (NEXT_PUBLIC_*):');
Object.keys(process.env)
  .filter(key => key.startsWith('NEXT_PUBLIC_'))
  .forEach(key => {
    const value = process.env[key];
    const display = value ? `${value.substring(0, 10)}...` : 'NOT SET';
    console.log(`   ${key}: ${display}`);
  });

console.log('\n🔧 Google APIs Status:');
console.log(`   Backend API Key: ${process.env.GOOGLE_PLACES_API_KEY ? 'SET' : 'MISSING'}`);
console.log(`   Frontend API Key: ${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'SET' : 'MISSING'}`);

// Test if we can make a simple API call
if (process.env.GOOGLE_PLACES_API_KEY) {
  console.log('\n🧪 Testing Google Places API...');
  
  fetch(`https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=restaurant&inputtype=textquery&key=${process.env.GOOGLE_PLACES_API_KEY}`)
    .then(response => response.json())
    .then(data => {
      if (data.status === 'OK') {
        console.log('✅ Google Places API is working');
      } else {
        console.log(`❌ Google Places API error: ${data.status}`);
      }
    })
    .catch(error => {
      console.error('❌ API test failed:', error.message);
    });
} else {
  console.log('❌ Cannot test Google Places API - key not set');
}

export default function handler(req, res) {
  return res.status(200).json({ 
    message: 'Check console for environment variable status',
    timestamp: new Date().toISOString()
  });
}