// leaderboard.js — a trending leaderboard backed by a Redis sorted set + a hash per post.
//
// Storage shape:
//   trending:posts        (sorted set)  member = postId, score = engagement
//   post:<id>:meta        (hash)        title, author

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
  return redis.zincrby("trending:posts", 1, postId);
}

/**
 * Fetch the top N posts, ranked from highest to lowest,
 * including their metadata (title and author).
 *
 * @param {number} n
 * @returns {Promise<Array<{ id: string, score: number, title?: string, author?: string }>>}
 */
export async function getTop(n) {
  // Get the top N post IDs and their scores.
  const flat = await redis.zrevrange(
    "trending:posts",
    0,
    n - 1,
    "WITHSCORES"
  );

  // Prepare rows and a single pipeline for metadata.
  const rows = [];
  const pipeline = redis.pipeline();

  for (let i = 0; i < flat.length; i += 2) {
    const id = flat[i];
    const score = Number(flat[i + 1]);

    rows.push({
      id,
      score,
    });

    // Queue one metadata lookup for each post.
    pipeline.hgetall(id + ":meta");
  }

  // Execute all metadata lookups together.
  const results = await pipeline.exec();

  // Combine each post's ID and score with its metadata.
  return rows.map((row, k) => ({
    ...row,
    ...results[k][1],
  }));
}

export { redis };