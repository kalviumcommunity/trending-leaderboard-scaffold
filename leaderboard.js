
import Redis from "ioredis";
import "dotenv/config";

const redis = new Redis(process.env.REDIS_URL);

export async function upvote(postId) {
  return redis.zincrby("trending:posts", 1, postId);
}

export async function getTop(n) {
  const flat = await redis.zrevrange(
    "trending:posts",
    0,
    n - 1,
    "WITHSCORES"
  );

  const rows = [];
  const pipeline = redis.pipeline();

  for (let i = 0; i < flat.length; i += 2) {
    const id = flat[i];

    rows.push({
      id,
      score: Number(flat[i + 1])
    });

    pipeline.hgetall(id + ":meta");
  }

  const results = await pipeline.exec();

  return rows.map((row, k) => ({
    ...row,
    ...results[k][1]
  }));
}

export { redis };
