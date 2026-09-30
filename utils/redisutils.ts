import Redis from "ioredis";
import { getBullMQConnection } from "../lib/redis";
import { reviewQueue } from "../lib/queue";
const redis = new Redis(process.env.REDIS_URL!);
export async function checkKey(Key: string) {
  try {
    const exists = await redis.exists(Key);
    return exists == 1;
  } catch (error) {
    console.log("validating Key Eror =", error);
    return false;
  }
}
export async function getCachedResult(key: string) {
  try {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.log("Cached Retrieveing Error =", error);
    return null;
  }
}
export async function setCachedResult(key: string, data: object) {
  try {
    await redis.set(key, JSON.stringify(data), "EX", 24 * 3600);
  } catch (error) {
    console.log("Not able to cache data is redis", error);
    return;
  }
}
export async function checkRedisAlive() {
  const connection = new Redis(getBullMQConnection());
  try {
    const pong = await connection.ping();
    return pong === "PONG";
  } catch (e) {
    console.log("Redis is not alive", e);
    return false;
  } finally {
    connection.disconnect();
  }
}
export async function checkWorkerAlive(): Promise<boolean> {
  const workers = await reviewQueue.getWorkers();
  return workers.length > 0;
}
