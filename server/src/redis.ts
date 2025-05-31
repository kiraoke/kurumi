import { RedisClient } from "@iuioiua/redis";

const redisConn: Deno.TcpConn = await Deno.connect({ port: 6379 });
const redisClient: RedisClient = new RedisClient(redisConn);

export default redisClient;

