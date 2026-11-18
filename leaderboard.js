
// leaderboard.js — a trending leaderboard backed by a Redis sorted set + a hash per post.

import Redis from "ioredis";
import "dotenv/config";

const redis = new Redis(process.env.REDIS_URL);

/**
 * Record one unit of engagement for a post.
 * Must be a SINGLE atomic Redis command.
 */
export async function upvote(postId) {
  const score = await redis.zincrby("trending:posts", 1, postId);
  return score;
}

/**
 * Fetch the top N posts, ranked high -> low,
 * each WITH its metadata (title, author).
 */
export async function getTop(n) {
  // 1. Get top N posts with their scores
  const posts = await redis.zrevrange(
    "trending:posts",
    0,
    n - 1,
    "WITHSCORES"
  );

  // 2. Build rows and create a pipeline
  const rows = [];
  const pipeline = redis.pipeline();

  for (let i = 0; i < posts.length; i += 2) {
    const id = posts[i];
    const score = Number(posts[i + 1]);

    rows.push({ id, score });

    // 3. Queue metadata retrieval
    pipeline.hgetall(id + ":meta");
  }

  // 4. Execute all HGETALL commands together
  const results = await pipeline.exec();

  // 5. Merge post data with metadata
  return rows.map((row, k) => ({
    ...row,
    ...results[k][1]
  }));
}

export { redis };
