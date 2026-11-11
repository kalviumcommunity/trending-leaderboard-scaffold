
import "dotenv/config";
import { redis } from "./leaderboard.js";

async function seed() {
    const pipeline = redis.pipeline();

    for (let i = 1; i <= 100; i++) {
        const postId = `post:${i}`;
        const score = Math.floor(Math.random() * 50);

        pipeline.hset(
            `${postId}:meta`,
            "title", `Post number ${i}`,
            "author", `@user${i}`
        );

        pipeline.zadd("trending:posts", score, postId);
    }

    await pipeline.exec();

    console.log("Seeded 100 posts.");

    await redis.quit();
}

seed().catch(console.error);
