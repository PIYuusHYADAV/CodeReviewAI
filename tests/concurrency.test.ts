import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { sql } from "drizzle-orm";

let db: ReturnType<typeof drizzle>;
vi.mock("../config", () => ({ getDb: () => db }));
vi.mock("../utils/redisutils.ts", () => ({ setCachedResult: vi.fn() }));

import {
  insertData,
  registerWaiter,
  getPendingWaiters,
  claimWaiter,
  updateData,
} from "../repository/dbrepo";

const REPO = "owner/repo";
const TREE = "tree-abc";

const claim = (pr: number, checkRunId: number) => {
  return insertData(
    REPO,
    TREE,
    pr,
    `commit-${pr}`,
    "base",
    `PR ${pr}`,
    "inst-1",
    checkRunId,
  );
};

beforeAll(async () => {
  db = drizzle(new PGlite());
  await db.execute(sql`SET TIME ZONE 'UTC'`);
  await migrate(db, { migrationsFolder: "./drizzle" });
});
beforeEach(async () => {
  await db.execute(
    sql`TRUNCATE TABLE "reviewWaiters", "userCredentials" CASCADE`,
  );
});

describe("claiming a review", () => {
  it("N simultaneous identical requests produce exactly one owner", async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) => claim(i + 1, 100 + i)),
    );
    expect(results.filter((r) => r?.status === "pending")).toHaveLength(1);
    expect(results.filter((r) => r?.status === "processing")).toHaveLength(9);

    const rows = await db.execute(
      sql`SELECT count(*)::int AS n FROM "userCredentials"`,
    );
    expect(rows.rows[0].n).toBe(1);
  });
  it("a request after completion gets the stored result", async () => {
    await claim(1, 100);
    await updateData(REPO, TREE, { overallScore: 8 } as never);
    const late = await claim(2, 101);
    expect(late?.status).toBe("completed");
    expect(late?.data).toMatchObject({ overallScore: 8 });
  });
  it("a failed review is re-claimed by exactly one retry", async () => {
    await claim(1, 100);
    await db.execute(sql`UPDATE "userCredentials" SET status = 'failed'`);
    const results = await Promise.all([
      claim(2, 101),
      claim(3, 102),
      claim(4, 103),
    ]);
    expect(results.filter((r) => r?.status === "pending")).toHaveLength(1);
  });
  it("a stale processing claim (over 15 min) is taken over once", async () => {
    await claim(1, 100);
    await db.execute(
      sql`UPDATE "userCredentials" SET status = 'processing', updated_at = now() - interval '20 minutes'`,
    );
    const results = await Promise.all([claim(2, 101), claim(3, 102)]);
    expect(results.filter((r) => r?.status === "pending")).toHaveLength(1);
  });
  it("a fresh processing claim is not taken over", async () => {
    await claim(1, 100);
    await db.execute(sql`UPDATE "userCredentials" SET status = 'processing'`);
    const second = await claim(2, 101);
    expect(second?.status).toBe("processing");
  });
});
describe("waiters", () => {
  const waiter = {
    prNumber: 2,
    commitsha: "c2",
    checkRunId: 101,
  };

  it("registering the same waiter twice stores it once", async () => {
    await claim(1, 100);
    await Promise.all([
      registerWaiter(REPO, TREE, waiter),
      registerWaiter(REPO, TREE, waiter),
    ]);
    expect(await getPendingWaiters(REPO, TREE)).toHaveLength(1);
  });

  it("concurrent delivery of one waiter succeeds exactly once", async () => {
    await claim(1, 100);
    await registerWaiter(REPO, TREE, waiter);
    const [pending] = await getPendingWaiters(REPO, TREE);

    const results = await Promise.all([
      claimWaiter(pending.id),
      claimWaiter(pending.id),
      claimWaiter(pending.id),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(await getPendingWaiters(REPO, TREE)).toHaveLength(0);
  });
  it("a waiter that registers after the owner finished still gets the result, once", async () => {
   
    await claim(1, 100);
    const second = await claim(2, 101);
    expect(second?.status).toBe("processing");

    
    await updateData(REPO, TREE, { overallScore: 8 } as never);
    expect(await getPendingWaiters(REPO, TREE)).toHaveLength(0);

   
    const review = await registerWaiter(REPO, TREE, {
      prNumber: 2,
      commitsha: "c2",
      checkRunId: 101,
    });

   
    expect(review?.status).toBe("completed");
    expect(review?.data).toMatchObject({ overallScore: 8 });

   
    const [mine] = await getPendingWaiters(REPO, TREE);
    const deliveries = await Promise.all([
      claimWaiter(mine.id),
      claimWaiter(mine.id),
    ]);
    expect(deliveries.filter(Boolean)).toHaveLength(1);
  });
});
