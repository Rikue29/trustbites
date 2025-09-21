import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoClient } from "./aws-config-compliant";

const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

export async function addReview(review: { 
  reviewId: string; 
  restaurantId: string; 
  reviewText: string; 
  isFake: boolean;
  sentiment?: string;
  language?: string;
  confidence?: number;
}) {
  const reviewWithTimestamp = {
    ...review,
    createdAt: new Date().toISOString(),
  };
  
  try {
    await dynamoDocClient.send(new PutCommand({
      TableName: "Reviews",
      Item: reviewWithTimestamp,
    }));
    return reviewWithTimestamp;
  } catch (error) {
    console.warn('DynamoDB not available, returning mock response:', error);
    return reviewWithTimestamp;
  }
}

export async function getReview(reviewId: string) {
  const data = await dynamoDocClient.send(new GetCommand({
    TableName: "Reviews",
    Key: { reviewId },
  }));
  return data.Item;
}

export async function listReviews() {
  // Return mock data for demo purposes
  console.log('Using mock review data for demo');
  return [
    {
      reviewId: '1',
      restaurantId: 'village-park-restaurant',
      reviewText: 'Amazing nasi lemak! The sambal is perfectly spiced and the chicken is crispy.',
      isFake: false,
      sentiment: 'POSITIVE',
      language: 'en',
      confidence: 0.85,
      author: 'Ahmad Rahman',
      rating: 5,
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      reviewId: '2',
      restaurantId: 'jalan-alor-food-street',
      reviewText: 'Best restaurant ever!!! Perfect everything!!! Five stars!!! Highly recommend!!!',
      isFake: true,
      sentiment: 'POSITIVE',
      language: 'en',
      confidence: 0.92,
      author: 'FakeReviewer123',
      rating: 5,
      createdAt: '2024-01-14T15:20:00Z'
    },
    {
      reviewId: '3',
      restaurantId: 'restoran-yut-kee',
      reviewText: 'Good Hainanese chicken rice. Reasonable prices and decent service.',
      isFake: false,
      sentiment: 'POSITIVE',
      language: 'en',
      confidence: 0.78,
      author: 'Sarah Lim',
      rating: 4,
      createdAt: '2024-01-13T12:45:00Z'
    },
    {
      reviewId: '4',
      restaurantId: 'hakka-restaurant',
      reviewText: 'Makanan di sini sangat sedap! Nasi lemak terbaik yang pernah saya makan.',
      isFake: false,
      sentiment: 'POSITIVE',
      language: 'ms',
      confidence: 0.88,
      author: 'Siti Nurhaliza',
      rating: 5,
      createdAt: '2024-01-12T18:30:00Z'
    },
    {
      reviewId: '5',
      restaurantId: 'village-park-restaurant',
      reviewText: 'Terrible place! Worst food ever! Never coming back! One star! Disgusting!',
      isFake: true,
      sentiment: 'NEGATIVE',
      language: 'en',
      confidence: 0.89,
      author: 'AngryCustomer456',
      rating: 1,
      createdAt: '2024-01-11T09:15:00Z'
    },
    {
      reviewId: '6',
      restaurantId: 'jalan-alor-food-street',
      reviewText: 'Great street food experience. Love the variety and authentic flavors.',
      isFake: false,
      sentiment: 'POSITIVE',
      language: 'en',
      confidence: 0.82,
      author: 'David Wong',
      rating: 4,
      createdAt: '2024-01-10T20:00:00Z'
    },
    {
      reviewId: '7',
      restaurantId: 'restoran-yut-kee',
      reviewText: 'Tempat yang baik untuk makan dengan keluarga. Harga berpatutan.',
      isFake: false,
      sentiment: 'POSITIVE',
      language: 'ms',
      confidence: 0.75,
      author: 'Farah Abdullah',
      rating: 4,
      createdAt: '2024-01-09T14:20:00Z'
    },
    {
      reviewId: '8',
      restaurantId: 'hakka-restaurant',
      reviewText: 'Outstanding Chinese cuisine! Amazing service! Perfect atmosphere! Best ever!',
      isFake: true,
      sentiment: 'POSITIVE',
      language: 'en',
      confidence: 0.94,
      author: 'PerfectReviewer789',
      rating: 5,
      createdAt: '2024-01-08T16:45:00Z'
    }
  ];
}
