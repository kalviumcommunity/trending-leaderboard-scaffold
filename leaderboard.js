
import Redis from "ioredis";
import "dotenv/config";

const redis = new Redis(process.env.REDIS_URL);

/**
 * Record one unit of engagement for a post.
 */
export async function upvote(postId) {
  const newScore = await redis.zincrby("trending:posts", 1, postId);

  return newScore;
}

/**
 * Fetch the top N posts with their metadata.
 */
export async function getTop(n) {
  // Step 1: Get top N posts with their scores
  const data = await redis.zrevrange(
    "trending:posts",
    0,
    n - 1,
    "WITHSCORES"
  );

  // Step 2: Convert flat array into rows
  const rows = [];

  const pipeline = redis.pipeline();

  for (let i = 0; i < data.length; i += 2) {
    const id = data[i];
    const score = Number(data[i + 1]);

    rows.push({ id, score });

    // Step 3: Queue metadata requests
    pipeline.hgetall(`${id}:meta`);
  }

  // Step 4: Execute all metadata requests together
  const results = await pipeline.exec();

  // Step 5: Merge post details with metadata
  return rows.map((row, k) => ({
    ...row,
    ...results[k][1]
  }));
}

export { redis };
