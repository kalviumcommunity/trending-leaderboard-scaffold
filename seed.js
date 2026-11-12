// seed.js — load 100 fake posts into the leaderboard.

import { redis } from "./leaderboard.js";

async function seed() {
  await redis.del("trending:posts");

  // Create one pipeline for all writes
  const pipeline = redis.pipeline();

  // Generate 100 posts
  for (let i = 1; i <= 100; i++) {
    const id = `post:${i}`;
    const title = `Post number ${i}`;
    const author = `@user${i}`;

    // Store post metadata
    pipeline.hset(`${id}:meta`, "title", title, "author", author);

    // Add post to sorted set with random score (0-49)
    const score = Math.floor(Math.random() * 50);
    pipeline.zadd("trending:posts", score, id);
  }

  // Execute all 200 commands together
  await pipeline.exec();

  console.log("Seeded 100 posts.");

  redis.disconnect();
}

seed();