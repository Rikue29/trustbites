import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  console.log('🔍 Production Environment Debug');
  
  const envStatus = {
    googlePlacesApi: !!process.env.GOOGLE_PLACES_API_KEY,
    googleMapsApi: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    awsRegion: !!process.env.TRUSTBITES_AWS_REGION,
    awsAccessKey: !!process.env.TRUSTBITES_ACCESS_KEY_ID,
    awsSecretKey: !!process.env.TRUSTBITES_SECRET_ACCESS_KEY,
    bedrockRegion: !!process.env.BEDROCK_REGION
  };

  // Get ALL environment variables to see what's actually available
  const allEnvVars = Object.keys(process.env)
    .filter(key => 
      key.includes('GOOGLE') || 
      key.includes('TRUSTBITES') || 
      key.includes('BEDROCK') ||
      key.includes('AWS')
    )
    .reduce((obj, key) => {
      obj[key] = process.env[key] ? `${process.env[key].substring(0, 10)}...` : 'NOT SET';
      return obj;
    }, {} as Record<string, string>);

  console.log('Environment Variables Status:', envStatus);
  console.log('All relevant env vars:', allEnvVars);

  // Test Google Places API if available
  let apiTest = null;
  if (process.env.GOOGLE_PLACES_API_KEY) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=restaurant&inputtype=textquery&key=${process.env.GOOGLE_PLACES_API_KEY}`
      );
      const data = await response.json();
      apiTest = {
        status: data.status,
        working: data.status === 'OK'
      };
    } catch (error) {
      apiTest = {
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
        working: false
      };
    }
  }

  return NextResponse.json({
    message: 'Environment Debug Info',
    timestamp: new Date().toISOString(),
    environment: envStatus,
    allRelevantEnvVars: allEnvVars,
    googlePlacesTest: apiTest,
    userAgent: process.env.NODE_ENV || 'unknown'
  });
}