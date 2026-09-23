import { db } from "../config";
import { userCredentials } from "../config/db/schema";
import { eq, and, sql, or } from "drizzle-orm";
import { ReviewResult } from "../lib/type";
import { setCachedResult } from "../utils/redisutils";
export async function insertData(
  data: string,
  treesha: string,
  prNumber: number,
  commitsha: string,
  basesha: string,
  title: string,
  installationId: string,
  checkRunId: number,
) {
  try {
    if (!data) {
      console.log("Missing repo identifier");
      return null;
    }

    const [existing] = await db
      .select()
      .from(userCredentials)
      .where(
        and(
          eq(userCredentials.userinfo, data),
          eq(userCredentials.treesha, treesha),
        ),
      );
    if (existing && existing.status == "completed" && existing.data) {
      const eventKey = `${data}--${treesha}`;
      await setCachedResult(eventKey, existing.data as object);
      return existing;
    } else if (existing && existing.status == "processing") {
      const STALE_PROCESSING_MS = 15 * 60 * 1000;
      const isStale =
        Date.now() - existing.updatedAt.getTime() > STALE_PROCESSING_MS;
      if (!isStale) return existing;
    }
    const [res] = await db
      .insert(userCredentials)
      .values({
        userinfo: data,
        treesha: treesha,
        prNumber: prNumber,
        commitsha: commitsha,
        basesha: basesha,
        title: title,
        installationId: installationId,
        checkRunId: checkRunId,
      })
      .onConflictDoUpdate({
        target: [userCredentials.userinfo, userCredentials.treesha],
        set: {
          prNumber: prNumber,
          commitsha: commitsha,
          basesha: basesha,
          title: title,
          installationId: installationId,
          checkRunId: checkRunId,
          status: "pending",
          updatedAt: new Date(),
        },
      })
      .returning();
    return res ?? null;
  } catch (error) {
    console.log("Database error", error);
    return null;
  }
}
export async function updateData(
  data: string,
  treesha: string,
  findings: ReviewResult,
) {
  try {
    const res = await db
      .update(userCredentials)
      .set({
        status: "completed",
        data: findings,
        attempts: sql`${userCredentials.attempts}+1`,
      })
      .where(
        and(
          eq(userCredentials.userinfo, data),
          eq(userCredentials.treesha, treesha),
        ),
      );
    return res;
  } catch (error) {
    console.log("Database Error", error);
    return null;
  }
}
export async function updateStatus(data: string, treesha: string) {
  try {
    const res = await db
      .update(userCredentials)
      .set({
        status: "processing",
      })
      .where(
        and(
          eq(userCredentials.userinfo, data),
          eq(userCredentials.treesha, treesha),
        ),
      );
    return res;
  } catch (error) {
    console.log("Database Error", error);
    return null;
  }
}
