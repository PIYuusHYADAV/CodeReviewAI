import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../config", () => ({ getDb: vi.fn() }));
vi.mock("../utils/redisutils", () => ({ setCachedResult: vi.fn() }));

import { getDb } from "../config";
import { setCachedResult } from "../utils/redisutils";
import { insertData } from "../repository/dbrepo";

function createDbMock(selectResult: any[], insertResult: any[] = []) {
  const db: any = {};
  db.select = vi.fn(() => db);
  db.from = vi.fn(() => db);
  db.where = vi.fn(() => Promise.resolve(selectResult));
  db.insert = vi.fn(() => db);
  db.values = vi.fn(() => db);
  db.onConflictDoUpdate = vi.fn(() => db);
  db.returning = vi.fn(() => Promise.resolve(insertResult));
  return db;
}

describe("insertData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns cached row and calls setCachedResult when status is completed", async () => {
    const existingRow = {
      userinfo: "owner/repo",
      treesha: "abc123",
      status: "completed",
      data: { overallScore: 8 },
    };
    const db = createDbMock([existingRow]);
    (getDb as any).mockReturnValue(db);

    const result = await insertData(
      "owner/repo",
      "abc123",
      1,
      "sha",
      "base",
      "title",
      "install-1",
      42,
    );

    expect(result).toEqual(existingRow);
    expect(setCachedResult).toHaveBeenCalledWith(
      "owner/repo--abc123",
      existingRow.data,
    );
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("returns existing row without inserting when status is processing and fresh", async () => {
    const existingRow = {
      userinfo: "owner/repo",
      treesha: "abc123",
      status: "processing",
      updatedAt: new Date(),
    };
    const db = createDbMock([existingRow]);
    (getDb as any).mockReturnValue(db);

    const result = await insertData(
      "owner/repo",
      "abc123",
      1,
      "sha",
      "base",
      "title",
      "install-1",
      42,
    );

    expect(result).toEqual(existingRow);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("falls through to upsert when status is processing but stale", async () => {
    const staleRow = {
      userinfo: "owner/repo",
      treesha: "abc123",
      status: "processing",
      updatedAt: new Date(Date.now() - 20 * 60 * 1000),
    };
    const upsertedRow = { ...staleRow, status: "pending" };
    const db = createDbMock([staleRow], [upsertedRow]);
    (getDb as any).mockReturnValue(db);

    const result = await insertData(
      "owner/repo",
      "abc123",
      1,
      "sha",
      "base",
      "title",
      "install-1",
      42,
    );

    expect(db.insert).toHaveBeenCalled();
    expect(result).toEqual(upsertedRow);
  });

  it("inserts a fresh row when no existing row is found", async () => {
    const newRow = {
      userinfo: "owner/repo",
      treesha: "abc123",
      status: "pending",
    };
    const db = createDbMock([], [newRow]);
    (getDb as any).mockReturnValue(db);

    const result = await insertData(
      "owner/repo",
      "abc123",
      1,
      "sha",
      "base",
      "title",
      "install-1",
      42,
    );

    expect(db.insert).toHaveBeenCalled();
    expect(result).toEqual(newRow);
  });

  it("returns null immediately if repo identifier is missing", async () => {
    const result = await insertData(
      "",
      "abc123",
      1,
      "sha",
      "base",
      "title",
      "install-1",
      42,
    );
    expect(result).toBeNull();
    expect(getDb).not.toHaveBeenCalled();
  });
});
