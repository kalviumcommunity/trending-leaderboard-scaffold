
import Redis from "ioredis";
import "dotenv/config";

const redis = new Redis(process.env.REDIS_URL);

export async function upvote(postId) {
    return redis.zincrby("trending:posts", 1, postId);
}

export async function getTop(n) {
    // Get ranked post IDs and scores
    const flat = await redis.zrevrange(
        "trending:posts",
        0,
        n - 1,
        "WITHSCORES"
    );

    const rows = [];
    const pipeline = redis.pipeline();

    // Queue all metadata requests
    for (let i = 0; i < flat.length; i += 2) {
        rows.push({
            id: flat[i],
            score: Number(flat[i + 1])
        });

        pipeline.hgetall(flat[i] + ":meta");
    }

    // Execute all metadata requests together
    const results = await pipeline.exec();

    // Merge scores and metadata
    return rows.map((row, k) => ({
        ...row,
        ...results[k][1]
    }));
}

export { redis };
