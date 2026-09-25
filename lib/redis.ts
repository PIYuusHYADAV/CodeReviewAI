let _bullMQConnection: {
  host: string;
  port: number;
  username?: string;
  password?: string;
  tls?: object;
  maxRetriesPerRequest: null;
} | null = null;

export function getBullMQConnection() {
  if (_bullMQConnection) return _bullMQConnection;

  const redisUrl = new URL(process.env.REDIS_URL!);

  _bullMQConnection = {
    host: redisUrl.hostname,
    port: Number(redisUrl.port) || 6379,
    username: redisUrl.username || undefined,
    password: redisUrl.password || undefined,
    tls: process.env.REDIS_URL?.startsWith("rediss://") ? {} : undefined,
    maxRetriesPerRequest: null,
  };

  return _bullMQConnection;
}
