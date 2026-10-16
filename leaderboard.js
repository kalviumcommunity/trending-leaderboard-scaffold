import Redis from "ioredis";
import "dotenv/config";

const redis = new Redis(process.env.REDIS_URL);

/**
 * Record one unit of engagement for a post.
 *
 * @param {string} postId
 * @returns {Promise<string>}
 */
export async function upvote(postId) {
  return redis.zincrby("trending:posts", 1, postId);
}

/**
 * Fetch the top N posts with their metadata.
 *
 * @param {number} n
 * @returns {Promise<Array<{ id: string, score: number, title?: string, author?: string }>>}
 */
export async function getTop(n) {
  // 1. Fetch post IDs and scores in descending order.
  const entries = await redis.zrevrange(
    "trending:posts",
    0,
    n - 1,
    "WITHSCORES"
  );

  // 2. Build rows and queue metadata lookups.
  const rows = [];

  const pipeline = redis.pipeline();

  for (let i = 0; i < entries.length; i += 2) {
    const id = entries[i];
    const score = Number(entries[i + 1]);

    rows.push({ id, score });

    pipeline.hgetall(`${id}:meta`);
  }

  // 3. Execute all metadata lookups in one pipeline.
  const results = await pipeline.exec();

  // 4. Merge metadata into each row.
  return rows.map((row, k) => ({
    ...row,
    ...(results[k][1] ?? {}),
  }));
}

export { redis };
