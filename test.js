import { getTop, upvote, redis } from "./leaderboard.js";
async function test() {
 try {
 console.log("Before upvoting:");
 console.log(await getTop(5));
 console.log("\nUpvoting post: post:50");
 for (let i = 0; i < 1000; i++) {
 await upvote("post:50");
 }
 console.log("\nAfter upvoting:");
 console.log(await getTop(5));
 } catch (error) {
 console.error(error);
 } finally {
 redis.disconnect();
 }
}
test();
