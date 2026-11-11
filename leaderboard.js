
import Redis from "ioredis";
import "dotenv/config";

// Connect to Redis.
const redis = new Redis(process.env.REDIS_URL);

/**
 * Increase a post's score by 1.
 */
export async function upvote(postId) {
  return redis.zincrby("trending:posts", 1, postId);
}

/**
 * Get the top N posts with their metadata.
 */
export async function getTop(n) {
  // Get post IDs and scores from highest to lowest.
  const flat = await redis.zrevrange(
    "trending:posts",
    0,
    n - 1,
    "WITHSCORES"
  );

  // Store post IDs and scores.
  const rows = [];

  // Create one Redis pipeline.
  const pipeline = redis.pipeline();

  // Queue metadata requests.
  for (let i = 0; i < flat.length; i += 2) {
    const id = flat[i];

    rows.push({
      id,
      score: Number(flat[i + 1])
    });

    pipeline.hgetall(id + ":meta");
  }

  // Execute all metadata requests together.
  const results = await pipeline.exec();

  // Combine scores and metadata.
  return rows.map((row, k) => ({
    ...row,
    ...results[k][1]
  }));
}

// Export Redis for seed.js and test.js.
export { redis };
