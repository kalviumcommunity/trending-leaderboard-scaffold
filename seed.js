
import { redis } from "./leaderboard.js";

async function seed() {
  await redis.del("trending:posts");

  const pipeline = redis.pipeline();

  for (let i = 1; i <= 100; i++) {
    const postId = `post:${i}`;

    pipeline.hset(
      `${postId}:meta`,
      "title",
      `Post number ${i}`,
      "author",
      `@user${i}`
    );

    pipeline.zadd(
      "trending:posts",
      Math.floor(Math.random() * 50),
      postId
    );
  }

  await pipeline.exec();

  console.log("Seeded 100 posts.");
  redis.disconnect();
}

seed();
