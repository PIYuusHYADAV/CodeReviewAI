import { Worker, Job } from "bullmq";
import { bullMQConnection } from "../lib/redis";
import {
  getDiffPr,
  getPrDetails,
  fileContents,
  postPRComment,
  postInlineComment,
} from "../lib/github";
import {
  runSecurityAgent,
  runPerformanceAgent,
  runArchitectureAgent,
  runStyleAgent,
} from "../lib/agent";
import { runAggregator } from "../lib/aggregator";
async function processReview(job: Job) {
  const { repo, prNumber, commitSha, title } = job.data;
  console.log(`\n[Worker] Processing PR #${prNumber} in ${repo}`);
  console.log(`  Commit : ${commitSha}`);
  console.log(`  Title  : ${title}`);
  console.log("Fetching PR details...");
  const diff = await getDiffPr(repo, prNumber);
  console.log("PF =================", diff);
  const details = await getPrDetails(repo, prNumber);
  console.log("Got details:", details);
  console.log(`[Worker] Fetched ${diff.length} changed files`);
  console.log(
    `[Worker] Files:`,
    diff.map((f) => `${f.status}: ${f.filename}`),
  );
  const filesWithContent = await fileContents(diff, repo, commitSha);

  const fileMetadata = filesWithContent.map((f) => ({
    filename: f.filename,
    status: f.status,
    contentLength: f.content.length,
    content: f.content,
  }));
  console.log(`total files ${fileMetadata.length}`);

  const [securityResult, performanceResult, styleResult, architectureResult] =
    await Promise.all([
      runSecurityAgent(diff, title),
      runPerformanceAgent(diff, title),
      runStyleAgent(diff, title),
      runArchitectureAgent(diff, fileMetadata, title),
    ]);
  const review = await runAggregator(
    [securityResult, performanceResult, styleResult, architectureResult],
    details.title,
  );
  console.log("[Agent:security] findings:", securityResult.findings);
  console.log("[Agent:performance] findings:", performanceResult.findings);
  console.log("[Agent:style] findings:", styleResult.findings);
  console.log("[Agent:architecture] findings:", architectureResult.findings);
  console.log("====== FINAL REVIEW ======");
  console.log("Overall Score:", review.overallScore);
  console.log("Summary:", review.summary);
  console.log("Breakdown:", review.breakdown);
  console.log("Total Findings:", review.findings.length);
  console.log("Findings:", JSON.stringify(review.findings, null, 2));
  await postPRComment(repo, prNumber, review.summary);
  const inlineFindings = review.findings.filter((f) => f.line);

  await Promise.allSettled(
    inlineFindings.map((f) =>
      postInlineComment(
        repo,
        prNumber,
        commitSha,
        f.line!,
        `${f.severity === "critical" ? "🔴" : f.severity === "warning" ? "🟡" : "🔵"} **${f.severity.toUpperCase()}** — ${f.message}`,

        f.file,
      ),
    ),
  );
  console.log(`✓ ${inlineFindings.length} inline comments posted`);
}
const worker = new Worker("review-queue", processReview, {
  connection: bullMQConnection,
  concurrency: 3,
});

worker.on("completed", (job) => {
  console.log(`✓ Job ${job.id} completed`);
});
worker.on("failed", (job, err) => {
  console.error(
    `✗ Job ${job?.id} failed (attempt ${job?.attemptsMade}):`,
    err.message,
  );
});
console.log("[Worker] Listening for review jobs...");
