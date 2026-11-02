
// seed.js — Load 100 fake posts into the leaderboard.

import { redis } from "./leaderboard.js";

async function seed() {
  // Clear the existing leaderboard.
  await redis.del("trending:posts");

  // Create one pipeline for all 200 Redis writes.
  const pipeline = redis.pipeline();

  for (let i = 1; i <= 100; i++) {
    const postId = `post:${i}`;

    // Store post metadata in a Redis hash.
    pipeline.hset(
      `${postId}:meta`,
      "title", `Post number ${i}`,
      "author", `@user${i}`
    );

    // Generate a random starting score between 0 and 49.
    const score = Math.floor(Math.random() * 50);

    // Add the post to the trending sorted set.
    pipeline.zadd("trending:posts", score, postId);
  }

  // Execute all 200 commands in one pipeline.
  await pipeline.exec();

  console.log("Seeded 100 posts.");

  redis.disconnect();
}

seed();
