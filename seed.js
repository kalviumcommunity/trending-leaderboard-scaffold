
import { redis } from "./leaderboard.js";

async function seed() {
  await redis.del("trending:posts");

  const pipeline = redis.pipeline();

  for (let i = 1; i <= 100; i++) {
    const postId = `post:${i}`;
    const randomScore = Math.floor(Math.random() * 50);

    // Store post metadata in Redis Hash
    pipeline.hset(
      `${postId}:meta`,
      "title",
      `Post number ${i}`,
      "author",
      `@user${i}`
    );

    // Store post score in Redis Sorted Set
    pipeline.zadd(
      "trending:posts",
      randomScore,
      postId
    );
  }

  // Execute all 200 commands in one pipeline
  await pipeline.exec();

  console.log("Seeded 100 posts.");

  redis.disconnect();
}

seed();
