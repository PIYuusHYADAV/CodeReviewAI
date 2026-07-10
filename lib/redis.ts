const redisUrl = new URL(process.env.REDIS_URL!);

export const bullMQConnection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port) || 6379,
  username: redisUrl.username || undefined,
  password: redisUrl.password || undefined,
  tls: process.env.REDIS_URL?.startsWith("redis://") ? {} : undefined,
  maxRetriesPerRequest: null,
};
