
import Redis from "ioredis";
import "dotenv/config";

const redis = new Redis(process.env.REDIS_URL);

// Increase a post's score by 1 atomically
export async function upvote(postId) {
  return redis.zincrby("trending:posts", 1, postId);
}

// Fetch top N posts with their metadata
export async function getTop(n) {
  const ranked = await redis.zrevrange(
    "trending:posts",
    0,
    n - 1,
    "WITHSCORES"
  );

  const rows = [];
  const pipeline = redis.pipeline();

  for (let i = 0; i < ranked.length; i += 2) {
    const id = ranked[i];
    const score = Number(ranked[i + 1]);

    rows.push({ id, score });

    pipeline.hgetall(`${id}:meta`);
  }

  const results = await pipeline.exec();

  return rows.map((row, k) => ({
    ...row,
    ...results[k][1]
  }));
}

export { redis };
