import { Worker, Job } from "bullmq";
import { bullMQConnection } from "../lib/redis";
import {
  getDiffPr,
  getPrDetails,
  fileContents,
  postPRComment,
  postInlineComment,
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
import { getValidDiffLines } from "../utils/Validate";
import { runAggregator } from "../lib/aggregator";
import http from "http";
import { updateData } from "../repository/dbrepo";
import { setCachedResult } from "../utils/redisutils";
import { userCredentials } from "../config/db/schema";
import { db } from "../config";
import { and, eq } from "drizzle-orm";
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

  const inlineFindings: typeof review.findings = [];
  const outOfDiffFindings: typeof review.findings = [];

  for (const f of review.findings) {
    if (!f.line) continue;

    const filePatch = diff.find((d) => d.filename === f.file)?.patch;
    const validLines = filePatch
      ? getValidDiffLines(filePatch)
      : new Set<number>();

    if (validLines.has(f.line)) {
      inlineFindings.push(f);
    } else {
      outOfDiffFindings.push(f);
    }
  }

  let finalSummary = review.summary;
  if (outOfDiffFindings.length > 0) {
    finalSummary += `\n\n---\n\n### Additional findings (outside this PR's diff)\n\n`;
    finalSummary += outOfDiffFindings
      .map((f) => {
        const emoji =
          f.severity === "critical"
            ? "🔴"
            : f.severity === "warning"
              ? "🟡"
              : "🔵";
        return `- ${emoji} **${f.severity.toUpperCase()}** — \`${f.file}${f.line ? `:${f.line}` : ""}\` — ${f.message}`;
      })
      .join("\n");
  }
  const inlineResults = await Promise.allSettled(
    inlineFindings.map((f) =>
      postInlineComment(
        repo,
        prNumber,
        commitSha,
        f.line!,
        `${f.severity === "critical" ? "🔴" : f.severity === "warning" ? "🟡" : "🔵"} **${f.severity.toUpperCase()}** — ${f.message}`,
        f.file,
        octokit,
      ),
    ),
  );

  await Promise.all([
    updateCheckRun(repo, checkRunId, review, octokit),

    updateData(repo, treesha, review),

    setCachedResult(cachedKey, review),
  ]);
  await postPRComment(repo, prNumber, finalSummary, octokit);

  console.log(`✓ ${inlineFindings.length} inline comments posted`);
}
const worker = new Worker("review-queue", processReview, {
  connection: bullMQConnection,
  concurrency: 3,
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
  const [repo, treesha] = job.id!.split("--");
  try {
    await db
      .update(userCredentials)
      .set({ status: "failed" })
      .where(
        and(
          eq(userCredentials.userinfo, repo),
          eq(userCredentials.treesha, treesha),
        ),
      );
    console.error(
      `Job ${job.id} permanently failed after ${job.attemptsMade} attempts — marked in DB`,
    );
  } catch (error) {
    console.log("database Error after job failed=", error);
  }
});
console.log("[Worker] Listening for review jobs...");
