import { Queue, QueueEvents } from "bullmq";
import { bullMQConnection } from "./redis";
export const reviewQueue = new Queue("review-queue", {
  connection: bullMQConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: {
      age: 24 * 3600,
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600,
    },
  },
});
