// leaderboard.js — a trending leaderboard backed by a Redis sorted set + a hash per post.
//
// Storage shape:
//   trending:posts        (sorted set)  member = postId, score = engagement  -> the ranking
//   post:<id>:meta        (hash)        title, author                        -> the metadata
//
// You implement the two exported functions below. Everything else is wired for you.

import Redis from "ioredis";
import "dotenv/config";

const redis = new Redis(process.env.REDIS_URL);

/**
 * Record one unit of engagement for a post.
 * Must be a SINGLE atomic Redis command (no read-modify-write).
 *
 * @param {string} postId  e.g. "post:104"
 * @returns {Promise<string>} the post's new score
 */
export async function upvote(postId) {
  const newScore = await redis.zincrby("trending:posts", 1, postId);
  return newScore;
}

/**
 * Fetch the top N posts, ranked high -> low, each WITH its metadata (title, author).
 * Must use ONE ioredis pipeline for all the HGETALL calls (not one round trip per post).
 *
 * @param {number} n  how many posts to return
 * @returns {Promise<Array<{ id: string, score: number, title?: string, author?: string }>>}
 */
export async function getTop(n) {
  if (!Number.isInteger(n) || n <= 0) {
    return [];
  }

  const ranked = await redis.zrevrange("trending:posts", 0, n - 1, "WITHSCORES");
  const rows = [];
  const pipeline = redis.pipeline();

  for (let i = 0; i < ranked.length; i += 2) {
    const id = ranked[i];
    const score = Number(ranked[i + 1]);
    rows.push({ id, score });
    pipeline.hgetall(`${id}:meta`);
  }

  const results = await pipeline.exec();

  return rows.map((row, index) => {
    const [error, value] = results[index] ?? [];
    return {
      ...row,
      ...(error ? {} : value ?? {}),
    };
  });
}

export { redis };
