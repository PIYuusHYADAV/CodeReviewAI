import { reviewQueue } from "../lib/queue";
import { returieveTheFilteredData } from "../repository/dbrepo";
import { checkRedisAlive, checkWorkerAlive } from "../utils/redisutils";

async function reconcile() {
  console.log("Check If Redis is active....");
  const status = await checkRedisAlive();
  if (status === false) {
    console.log("[Redis] is not alive and working...");
    process.exit(0);
  }
  const workerStatus = await checkWorkerAlive();
  if (workerStatus === false) {
    console.log("[Worker] is busy...");
    process.exit(0);
  }
  console.log("[Redis] is working....");
  console.log("[Worker] is up and runing..");
  console.log("[Reconcile] Starting sweep for stale processing jobs...");
  const data = await returieveTheFilteredData();
  if (data === null) {
    console.error("[Reconcile] Failed to fetch stale data — aborting sweep.");
    process.exit(1);
  }
  if (data.length === 0) {
    console.log("[Reconcile] No stale rows found. Nothing to requeue.");
    process.exit(0);
  }
  console.log(`[Reconcile] Found ${data.length} stale row(s) to requeue.`);
  for (const row of data) {
    const jobId = `${row.userinfo}--${row.treesha}`;
    try {
      await reviewQueue.add(
        "review-pr",
        {
          repo: row.userinfo,
          prNumber: row.prNumber,
          commitSha: row.commitsha,
          basesha: row.basesha,
          title: row.title,
          installationId: row.installationId,
          checkRunId: row.checkRunId,
        },
        { jobId },
      );
      console.log(`[Reconcile] Requeued ${jobId}`);
    } catch (error) {
      console.error(`[Reconcile] Failed to requeue ${jobId}:`, error);
    }
  }
  console.log("[Reconcile] Sweep complete.");
  process.exit(0);
}
reconcile().catch((error) => {
  console.error("[Reconcile] Unexpected error:", error);
  process.exit(1);
});
