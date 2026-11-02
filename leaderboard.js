
// leaderboard.js — Trending leaderboard using Redis sorted set and hashes.

import Redis from "ioredis";
import "dotenv/config";

const redis = new Redis(process.env.REDIS_URL);

/**
 * Record one upvote for a post.
 * Uses a single atomic ZINCRBY command.
 */
export async function upvote(postId) {
  return redis.zincrby("trending:posts", 1, postId);
}

/**
 * Fetch the top N posts with their metadata.
 * Uses one pipeline for all HGETALL commands.
 */
export async function getTop(n) {
  // Get ranked post IDs and their scores.
  const flat = await redis.zrevrange(
    "trending:posts",
    0,
    n - 1,
    "WITHSCORES"
  );

  const rows = [];
  const pipeline = redis.pipeline();

  // Build rows and queue metadata requests.
  for (let i = 0; i < flat.length; i += 2) {
    rows.push({
      id: flat[i],
      score: Number(flat[i + 1])
    });

    pipeline.hgetall(flat[i] + ":meta");
  }

  // Execute all metadata requests in one pipeline.
  const results = await pipeline.exec();

  // Merge ranking information with post metadata.
  return rows.map((row, k) => ({
    ...row,
    ...results[k][1]
  }));
}

export { redis };
