
import Redis from "ioredis";
import "dotenv/config";

const redis = new Redis(process.env.REDIS_URL);

/**
 * Record one unit of engagement for a post.
 */
export async function upvote(postId) {
  return await redis.zincrby("trending:posts", 1, postId);
}

/**
 * Fetch the top N posts with their metadata.
 */
export async function getTop(n) {
  // 1. Get top posts with scores (high to low)
  const data = await redis.zrevrange(
    "trending:posts",
    0,
    n - 1,
    "WITHSCORES"
  );

  // 2. Build rows and create pipeline
  const rows = [];
  const pipeline = redis.pipeline();

  for (let i = 0; i < data.length; i += 2) {
    const id = data[i];
    const score = Number(data[i + 1]);

    rows.push({ id, score });

    // 3. Queue metadata request
    pipeline.hgetall(id + ":meta");
  }

  // 4. Execute all commands together
  const results = await pipeline.exec();

  // 5. Merge post details with metadata
  return rows.map((row, k) => ({
    ...row,
    ...results[k][1]
  }));
}

export { redis };
