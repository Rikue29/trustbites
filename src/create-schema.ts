import * as dotenv from "dotenv";
import { DynamoDBClient, CreateTableCommand } from "@aws-sdk/client-dynamodb";

// Load environment variables
dotenv.config({ path: '.env.local' });

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function createTrustBitesSchema() {
  try {
    // 1. Restaurants Table
    console.log("Creating Restaurants table...");
    await client.send(new CreateTableCommand({
      TableName: "Restaurants",
      KeySchema: [
        { AttributeName: "restaurantId", KeyType: "HASH" } // Partition key
      ],
      AttributeDefinitions: [
        { AttributeName: "restaurantId", AttributeType: "S" },
        { AttributeName: "location", AttributeType: "S" }, // For location-based queries
        { AttributeName: "cuisine", AttributeType: "S" }   // For filtering by cuisine
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "LocationIndex",
          KeySchema: [
            { AttributeName: "location", KeyType: "HASH" }
          ],
          Projection: { ProjectionType: "ALL" }
        },
        {
          IndexName: "CuisineIndex", 
          KeySchema: [
            { AttributeName: "cuisine", KeyType: "HASH" }
          ],
          Projection: { ProjectionType: "ALL" }
        }
      ],
      BillingMode: "PAY_PER_REQUEST"
    }));

    // 2. Reviews Table (enhanced schema)
    console.log("Creating Reviews table...");
    await client.send(new CreateTableCommand({
      TableName: "Reviews",
      KeySchema: [
        { AttributeName: "reviewId", KeyType: "HASH" } // Partition key
      ],
      AttributeDefinitions: [
        { AttributeName: "reviewId", AttributeType: "S" },
        { AttributeName: "restaurantId", AttributeType: "S" }, // For querying by restaurant
        { AttributeName: "scrapedAt", AttributeType: "S" },    // For time-based queries
        { AttributeName: "isFake", AttributeType: "S" }        // For filtering fake/real reviews
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "RestaurantIndex",
          KeySchema: [
            { AttributeName: "restaurantId", KeyType: "HASH" },
            { AttributeName: "scrapedAt", KeyType: "RANGE" }
          ],
          Projection: { ProjectionType: "ALL" }
        },
        {
          IndexName: "FakeReviewsIndex",
          KeySchema: [
            { AttributeName: "isFake", KeyType: "HASH" },
            { AttributeName: "scrapedAt", KeyType: "RANGE" }
          ],
          Projection: { ProjectionType: "ALL" }
        }
      ],
      BillingMode: "PAY_PER_REQUEST"
    }));

    // 3. Analysis Results Table
    console.log("Creating AnalysisResults table...");
    await client.send(new CreateTableCommand({
      TableName: "AnalysisResults",
      KeySchema: [
        { AttributeName: "analysisId", KeyType: "HASH" } // Partition key
      ],
      AttributeDefinitions: [
        { AttributeName: "analysisId", AttributeType: "S" },
        { AttributeName: "restaurantId", AttributeType: "S" },
        { AttributeName: "analysisDate", AttributeType: "S" }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "RestaurantAnalysisIndex",
          KeySchema: [
            { AttributeName: "restaurantId", KeyType: "HASH" },
            { AttributeName: "analysisDate", KeyType: "RANGE" }
          ],
          Projection: { ProjectionType: "ALL" }
        }
      ],
      BillingMode: "PAY_PER_REQUEST"
    }));

    console.log("✅ All tables created successfully!");
    console.log("Wait a few seconds for tables to become active...");

  } catch (error: any) {
    if (error.name === "ResourceInUseException") {
      console.log("⚠️ Some tables already exist - skipping creation");
    } else {
      console.error("❌ Error creating schema:", error);
    }
  }
}

// Schema documentation
console.log(`
🗄️ TrustBites Database Schema:

📍 RESTAURANTS TABLE:
- restaurantId (PK): Unique restaurant identifier  
- name: Restaurant name
- address: Full address
- location: City/area for location-based queries
- cuisine: Type of cuisine (Malaysian, Chinese, etc.)
- latitude, longitude: GPS coordinates
- avgRating: Average rating from scraped reviews
- totalReviews: Total number of reviews scraped
- lastScraped: When this restaurant was last scraped
- googlePlaceId: Google Maps place ID

📝 REVIEWS TABLE:  
- reviewId (PK): Unique review identifier
- restaurantId (GSI): Links to restaurant
- authorName: Reviewer name from Google Maps
- reviewText: The actual review content
- rating: Star rating (1-5)
- reviewDate: When review was originally posted
- scrapedAt (GSI): When we scraped this review
- language: Detected language (en, ms, etc.)
- isFake (GSI): Classification result (true/false/pending)
- confidence: ML confidence score (0-1)
- sentiment: POSITIVE/NEGATIVE/NEUTRAL/MIXED
- comprehendAnalysis: Full Comprehend analysis results
- sagemakerAnalysis: SageMaker model results
- sourceUrl: Google Maps review URL

🔬 ANALYSIS_RESULTS TABLE:
- analysisId (PK): Unique analysis session ID
- restaurantId (GSI): Restaurant being analyzed
- analysisDate (GSI): When analysis was performed
- totalReviews: Number of reviews analyzed
- fakeCount: Number of reviews flagged as fake
- fakePercentage: Percentage of fake reviews
- averageSentiment: Overall sentiment score
- languageBreakdown: Distribution of languages
- confidenceDistribution: ML confidence metrics
- recommendations: Suggestions for restaurant owners
`);

createTrustBitesSchema();