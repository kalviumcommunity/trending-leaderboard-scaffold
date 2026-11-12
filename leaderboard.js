// leaderboard.js — a trending leaderboard backed by a Redis sorted set + a hash per post.

import Redis from "ioredis";
import "dotenv/config";

const redis = new Redis(process.env.REDIS_URL);

/**
 * Record one unit of engagement for a post.
 * Must be a SINGLE atomic Redis command.
 *
 * @param {string} postId
 * @returns {Promise<string>}
 */
export async function upvote(postId) {
  const newScore = await redis.zincrby("trending:posts", 1, postId);
  return newScore;
}

/**
 * Fetch the top N posts with their metadata.
 *
 * @param {number} n
 * @returns {Promise<Array<{ id: string, score: number, title?: string, author?: string }>>}
 */
export async function getTop(n) {
  // 1. Get posts ranked from highest to lowest
  const data = await redis.zrevrange(
    "trending:posts",
    0,
    n - 1,
    "WITHSCORES"
  );

  // 2. Create rows and a Redis pipeline
  const rows = [];
  const pipeline = redis.pipeline();

  for (let i = 0; i < data.length; i += 2) {
    const id = data[i];
    const score = Number(data[i + 1]);

    rows.push({ id, score });

    // 3. Queue metadata retrieval
    pipeline.hgetall(`${id}:meta`);
  }

  // 4. Execute all HGETALL commands together
  const results = await pipeline.exec();

  // 5. Merge post details with metadata
  return rows.map((row, k) => ({
    ...row,
    ...results[k][1]
  }));
}

export { redis };