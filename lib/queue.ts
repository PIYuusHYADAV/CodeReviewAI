import { Queue } from "bullmq";
import { bullMQConnection } from "./redis";
export const reviewQueue = new Queue("review-queue", {
  connection: bullMQConnection,
});
