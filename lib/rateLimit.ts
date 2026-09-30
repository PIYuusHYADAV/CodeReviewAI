import Redis from "ioredis";
import { getBullMQConnection } from "./redis";
import { RateLimitResult } from "./type";
let _redis: Redis | null = null;
function getRedisClient(): Redis {
  if (_redis) return _redis;
  _redis = new Redis(getBullMQConnection());
  return _redis;
}
export async function checkRateLimit(
  key: string,
  totalRequest: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const redis = await getRedisClient();
  const redisKey = `ratelimit:${key}`;
  try {
    const count = await redis.incr(redisKey);
    if (count == 1) await redis.expire(redisKey, windowSeconds);
    if (count > totalRequest) {
      const ttl = await redis.ttl(redisKey);
      return {
        limited: true,
        retryAfter: ttl > 0 ? ttl : windowSeconds,
        remaining: 0,
      };
    }
    return {
      limited: false,
      retryAfter: 0,
      remaining: totalRequest - count,
    };
  } catch (error) {
    console.log("Some issue occured in rate limiting", error);
    return { limited: false, retryAfter: 0, remaining: totalRequest };
  }
}
