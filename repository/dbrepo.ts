import { getDb } from "../config";
import { userCredentials } from "../config/db/schema";
import { eq, and, sql, lt, gt } from "drizzle-orm";
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
    const db = getDb();

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
    const db = getDb();
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
    const db = getDb();
    const res = await db
      .update(userCredentials)
      .set({
        status: "processing",
        updatedAt: new Date(),
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
async function retrieveAllHoldingData() {
  try {
    const db = getDb();
    const threshold_Time = 24 * 60 * 60 * 1000;
    const staleDataTime = new Date(Date.now() - threshold_Time);
    const res = await db
      .select()
      .from(userCredentials)
      .where(
        and(
          eq(userCredentials.status, "processing"),
          lt(userCredentials.updatedAt, staleDataTime),
        ),
      );
    return res;
  } catch (e) {
    throw new Error("database Error Occured for fetching the stale data");
  }
}
async function filterOutSupressedRows(
  staleRows: (typeof userCredentials.$inferSelect)[],
) {
  try {
    const db = getDb();
    const realData = [];
    for (const row of staleRows) {
      const [newrow] = await db
        .select()
        .from(userCredentials)
        .where(
          and(
            eq(userCredentials.userinfo, row.userinfo),
            eq(userCredentials.prNumber, row.prNumber),
            gt(userCredentials.createdAt, row.createdAt),
          ),
        )
        .limit(1);
      if (!newrow) realData.push(row);
    }
    return realData;
  } catch (e) {
    throw new Error("Error in suppressing the data");
  }
}
export async function returieveTheFilteredData() {
  try {
    const data = await retrieveAllHoldingData();
    if (!data) return null;
    const freshData = await filterOutSupressedRows(data);
    return freshData;
  } catch (error) {
    console.log("Encountered an error in fetching the stale data=", error);
    return null;
  }
}
