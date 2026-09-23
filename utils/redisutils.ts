import Redis from "ioredis";

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
