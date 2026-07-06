const redisUrl = new URL(process.env.REDIS_URL!);

export const bullMQConnection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port) || 6379,
  password: redisUrl.password || undefined,
  maxRetriesPerRequest: null,
};
