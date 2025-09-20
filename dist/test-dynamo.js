import * as dotenv from "dotenv";
import { addReview, getReview, listReviews } from "./db.js";
// Load environment variables from .env.local file
dotenv.config({ path: '.env.local' });
// Debug: Check if environment variables are loaded
console.log('AWS_REGION:', process.env.AWS_REGION);
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '***set***' : 'NOT SET');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '***set***' : 'NOT SET');
async function main() {
    // Insert a review
    await addReview({
        reviewId: "1",
        restaurantId: "resto-123",
        reviewText: "Food was amazing!",
        isFake: false
    });
    // Fetch by id
    console.log("Review 1:", await getReview("1"));
    // List all
    console.log("All reviews:", await listReviews());
}
main();
