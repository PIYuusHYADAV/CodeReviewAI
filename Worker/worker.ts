import { Worker, Job } from "bullmq";
import { getBullMQConnection } from "../lib/redis";
import {
  getDiffPr,
  getPrDetails,
  fileContents,
  getOctokit,
  updateCheckRun,
} from "../lib/github";
import {
  runSecurityAgent,
  runPerformanceAgent,
  runArchitectureAgent,
  runStyleAgent,
  compressFileContent,
} from "../lib/agent";

import { runAggregator } from "../lib/aggregator";
import http from "http";
import {
  updateData,
  getPendingWaiters,
  claimWaiter,
  markWaiterFailed,
  failPendingWaiters,
} from "../repository/dbrepo";
import { setCachedResult } from "../utils/redisutils";
import { userCredentials } from "../config/db/schema";
import { getDb } from "../config";
import { and, eq } from "drizzle-orm";
import { publishReview } from "../lib/publish";

const PORT = process.env.PORT || 3001;
http
  .createServer((req, res) => {
    res.writeHead(200);
    res.end("Worker running");
  })
  .listen(PORT, () => {
    console.log(`[Worker] Health check server on port ${PORT}`);
  });
async function processReview(job: Job) {
  const db = getDb();
  const treesha = job.id?.split("--").pop();

  if (treesha === undefined) {
    throw new Error("Invalid job ID");
  }
  console.log("Worker JOb", job);

  const { repo, prNumber, commitSha, title, installationId, checkRunId } =
    job.data;

  const octokit = await getOctokit(installationId);

  const diff = await getDiffPr(repo, prNumber, octokit);

  const details = await getPrDetails(repo, prNumber, octokit);

  const filesWithContent = await fileContents(diff, repo, commitSha, octokit);

  const fileMetadata = filesWithContent.map((f) => ({
    filename: f.filename,
    status: f.status,
    contentLength: f.content.length,
    content: f.content,
  }));
  const compressedFiles = await Promise.all(
    fileMetadata.map(async (f) => ({
      ...f,
      content: await compressFileContent(
        f.filename,
        f.content,
        diff.find((d) => d.filename === f.filename)?.patch ?? "",
      ),
    })),
  );

  const cachedKey = `${repo}--${treesha}`;

  const [securityResult, performanceResult, styleResult, architectureResult] =
    await Promise.all([
      runSecurityAgent(diff, title, compressedFiles),
      runPerformanceAgent(diff, title, compressedFiles),
      runStyleAgent(diff, title),
      runArchitectureAgent(diff, compressedFiles, title),
    ]);
  console.log("Security", securityResult);
  console.log("Performance", performanceResult);
  console.log("Style", styleResult);
  console.log("Architecture", architectureResult);
  const review = await runAggregator(
    [securityResult, performanceResult, styleResult, architectureResult],
    details.title,
  );
  console.log("Aggregations", runAggregator);
  await Promise.all([
    updateData(repo, treesha, review),
    setCachedResult(cachedKey, review),
  ]);
  const count = await publishReview({
    repo,
    prNumber,
    commitSha,
    checkRunId,
    review,
    octokit,
  });
  const waiters = await getPendingWaiters(repo, treesha);
  const seenPRs = new Set<number>([prNumber]);
  await Promise.allSettled(
    waiters.map(async (w) => {
      const claimed = await claimWaiter(w.id);
      if (!claimed) return;
      try {
        if (seenPRs.has(w.prNumber)) {
          await updateCheckRun(repo, w.checkRunId, review, octokit);
        } else {
          seenPRs.add(w.prNumber);
          await publishReview({
            repo,
            prNumber: w.prNumber,
            commitSha: w.commitsha,
            checkRunId: w.checkRunId,
            review,
            octokit,
          });
        }
      } catch (e) {
        await markWaiterFailed(
          w.id,
          e instanceof Error ? e.message : String(e),
        );
      }
    }),
  );

  console.log(
    `✓ ${count} inline comments, ${waiters.length} waiter(s) handled`,
  );
}
const worker = new Worker("review-queue", processReview, {
  connection: getBullMQConnection(),
  concurrency: 3,
  drainDelay: 10,
});

worker.on("completed", (job) => {
  console.log(`✓ Job ${job.id} completed`);
});
worker.on("failed", async (job, err) => {
  console.error(
    `✗ Job ${job?.id} failed (attempt ${job?.attemptsMade}):`,
    err.message,
  );
  if (!job) return;
  const maxAttempts = job.opts.attempts ?? 1;
  if (job.attemptsMade < maxAttempts) return;
  const parts = job.id!.split("--");
  const repo = parts[0];
  const treesha = parts[parts.length - 1];
  try {
    const db = getDb();
    await db
      .update(userCredentials)
      .set({ status: "failed" })
      .where(
        and(
          eq(userCredentials.userinfo, repo),
          eq(userCredentials.treesha, treesha),
        ),
      );
    await failPendingWaiters(repo, treesha, `Review failed: ${err.message}`);
    console.error(
      `Job ${job.id} permanently failed after ${job.attemptsMade} attempts — marked in DB`,
    );
  } catch (error) {
    console.log("database Error after job failed=", error);
  }
});
console.log("[Worker] Listening for review jobs...");
