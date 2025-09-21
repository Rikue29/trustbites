import * as dotenv from "dotenv";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoClient } from "./lib/aws-config-compliant";

// Load environment variables
dotenv.config({ path: '.env.local' });

const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

async function verifyData() {
  console.log('🔍 Verifying data in DynamoDB tables...\n');
  
  try {
    // Check Restaurants table
    console.log('📍 RESTAURANTS TABLE:');
    const restaurantsResult = await dynamoDocClient.send(new ScanCommand({
      TableName: "Restaurants",
      Limit: 5 // Just get first 5 items
    }));
    
    if (restaurantsResult.Items && restaurantsResult.Items.length > 0) {
      console.log(`✅ Found ${restaurantsResult.Items.length} restaurants:`);
      restaurantsResult.Items.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name} (${item.location})`);
      });
    } else {
      console.log('❌ No restaurants found');
    }
    
    console.log('\n📝 REVIEWS TABLE:');
    const reviewsResult = await dynamoDocClient.send(new ScanCommand({
      TableName: "Reviews",
      Limit: 5 // Just get first 5 items
    }));
    
    if (reviewsResult.Items && reviewsResult.Items.length > 0) {
      console.log(`✅ Found ${reviewsResult.Items.length} reviews (showing first 5):`);
      reviewsResult.Items.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.authorName}: "${item.reviewText.substring(0, 50)}..." (${item.rating}⭐)`);
      });
    } else {
      console.log('❌ No reviews found');
    }
    
    console.log('\n📊 ANALYSIS RESULTS TABLE:');
    const analysisResult = await dynamoDocClient.send(new ScanCommand({
      TableName: "AnalysisResults",
      Limit: 5 // Just get first 5 items
    }));
    
    if (analysisResult.Items && analysisResult.Items.length > 0) {
      console.log(`✅ Found ${analysisResult.Items.length} analysis results:`);
      analysisResult.Items.forEach((item, index) => {
        console.log(`   ${index + 1}. Restaurant analysis: ${item.fakePercentage}% fake reviews`);
      });
    } else {
      console.log('❌ No analysis results found');
    }
    
    console.log('\n🎯 AWS REGION AND CREDENTIALS:');
    console.log(`Region: ${process.env.AWS_REGION || 'Not set'}`);
    console.log(`Access Key: ${process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set'}`);
    console.log(`Secret Key: ${process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set'}`);
    
  } catch (error) {
    console.error('❌ Error verifying data:', error);
  }
}

verifyData();