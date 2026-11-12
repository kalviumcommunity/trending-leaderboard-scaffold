
import { redis } from "./leaderboard.js";

async function seed() {
  await redis.del("trending:posts");

  // Create one pipeline for all Redis commands
  const pipeline = redis.pipeline();

  // Generate 100 posts
  for (let i = 1; i <= 100; i++) {
    const postId = `post:${i}`;
    const title = `Post number ${i}`;
    const author = `@user${i}`;

    // Random starting score between 0 and 49
    const score = Math.floor(Math.random() * 50);

    // Store post metadata
    pipeline.hset(
      `${postId}:meta`,
      "title",
      title,
      "author",
      author
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
