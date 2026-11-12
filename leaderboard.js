
import Redis from "ioredis";
import "dotenv/config";

const redis = new Redis(process.env.REDIS_URL);

/**
 * Record one unit of engagement for a post.
 * Uses a single atomic Redis command.
 *
 * @param {string} postId
 * @returns {Promise<string>}
 */
export async function upvote(postId) {
  return await redis.zincrby("trending:posts", 1, postId);
}

/**
 * Fetch the top N posts with their metadata.
 *
 * @param {number} n
 * @returns {Promise<Array<{ id: string, score: number, title?: string, author?: string }>>}
 */
export async function getTop(n) {
  // 1. Get top N posts with scores (high to low)
  const data = await redis.zrevrange(
    "trending:posts",
    0,
    n - 1,
    "WITHSCORES"
  );

  // 2. Create rows and queue metadata requests
  const rows = [];
  const pipeline = redis.pipeline();

  for (let i = 0; i < data.length; i += 2) {
    const id = data[i];
    const score = Number(data[i + 1]);

    rows.push({ id, score });

    // Queue HGETALL for each post
    pipeline.hgetall(id + ":meta");
  }

  // 3. Execute all metadata requests together
  const results = await pipeline.exec();

  // 4. Merge post data with metadata
  return rows.map((row, k) => ({
    ...row,
    ...results[k][1]
  }));
}

export { redis };
