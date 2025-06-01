import { RedisClient } from "@iuioiua/redis";

let redis: RedisClient | null = null;

async function connectToRedisWithRetry(
  retries = 5,
  delayMs = 1000,
): Promise<RedisClient | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const redisConn: Deno.TcpConn = await Deno.connect({ port: 6379 });
      const redisClient: RedisClient = new RedisClient(redisConn);
      console.log(`✅ Redis connected on attempt ${attempt}`);
      return redisClient;
    } catch (err) {
      console.error(
        `❌ Redis connection failed (attempt ${attempt}):`,
        (err as Error).message,
      );
      if (attempt < retries) {
        const waitTime = delayMs * attempt; // exponential backoff
        console.log(`🔁 Retrying in ${waitTime}ms...`);
        await new Promise((res) => setTimeout(res, waitTime));
      }
    }
  }

  console.error("🚫 Failed to connect to Redis after all retries.");
  return null;
}

redis = await connectToRedisWithRetry();

export default redis;
