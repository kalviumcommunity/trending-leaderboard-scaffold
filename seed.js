
import { redis } from "./leaderboard.js";

async function seed() {
  // Clear the previous leaderboard.
  await redis.del("trending:posts");

  // Create one pipeline for all 200 writes.
  const pipeline = redis.pipeline();

  for (let i = 1; i <= 100; i++) {
    const id = "post:" + i;

    // Store title and author.
    pipeline.hset(
      id + ":meta",
      "title", "Post number " + i,
      "author", "@user" + i
    );

    // Generate a random score between 0 and 49.
    const score = Math.floor(Math.random() * 50);

    // Add the post to the leaderboard.
    pipeline.zadd("trending:posts", score, id);
  }

  // Execute all 200 commands.
  await pipeline.exec();

  console.log("Seeded 100 posts.");

  redis.disconnect();
}

seed();
