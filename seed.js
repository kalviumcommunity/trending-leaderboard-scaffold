
import { redis } from "./leaderboard.js";

async function seed() {
  await redis.del("trending:posts");

  const pipeline = redis.pipeline();

  for (let i = 1; i <= 100; i++) {
    const postId = `post:${i}`;
    const metaKey = `${postId}:meta`;
    const score = Math.floor(Math.random() * 50);

    // Store post metadata.
    pipeline.hset(
      metaKey,
      "title", `Post number ${i}`,
      "author", `@user${i}`
    );

    // Add the post to the leaderboard.
    pipeline.zadd("trending:posts", score, postId);
  }

  // Execute all 200 commands in one pipeline.
  await pipeline.exec();

  console.log("Seeded 100 posts.");

  redis.disconnect();
}

seed();
