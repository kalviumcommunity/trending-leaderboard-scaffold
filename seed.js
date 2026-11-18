
import { redis } from "./leaderboard.js";

async function seed() {
  await redis.del("trending:posts");

  // Create one Redis pipeline
  const pipeline = redis.pipeline();

  // Generate 100 posts
  for (let i = 1; i <= 100; i++) {
    const postId = `post:${i}`;
    const metaKey = `${postId}:meta`;

    // Generate random starting score between 0 and 49
    const score = Math.floor(Math.random() * 50);

    // Store post metadata
    pipeline.hset(
      metaKey,
      "title",
      `Post number ${i}`,
      "author",
      `@user${i}`
    );

    // Add post to leaderboard
    pipeline.zadd("trending:posts", score, postId);
  }

  // Execute all 200 commands together
  await pipeline.exec();

  console.log("Seeded 100 posts.");

  redis.disconnect();
}

seed();
