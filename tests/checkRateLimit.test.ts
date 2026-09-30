import { describe, it, expect, vi, beforeEach } from "vitest";

const mockIncr = vi.fn();
const mockExpire = vi.fn();
const mockTtl = vi.fn();

vi.mock("ioredis", () => {
  return {
    default: vi.fn().mockImplementation(function () {
      return {
        incr: mockIncr,
        expire: mockExpire,
        ttl: mockTtl,
      };
    }),
  };
});
vi.mock("../lib/redis.ts", () => ({
  getBullMQConnection: vi.fn(() => ({})),
}));

import { checkRateLimit } from "../lib/rateLimit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows the first request and sets expiry", async () => {
    mockIncr.mockResolvedValue(1);

    const result = await checkRateLimit("test-key", 1, 60);

    expect(result).toEqual({ limited: false, retryAfter: 0, remaining: 0 });
    expect(mockExpire).toHaveBeenCalledWith("ratelimit:test-key", 60);
  });

  it("does not re-set expiry on a subsequent request within the limit", async () => {
    mockIncr.mockResolvedValue(2);

    const result = await checkRateLimit("test-key", 3, 60);

    expect(result).toEqual({ limited: false, retryAfter: 0, remaining: 1 });
    expect(mockExpire).not.toHaveBeenCalled();
  });

  it("blocks a request that exceeds the limit", async () => {
    mockIncr.mockResolvedValue(2);
    mockTtl.mockResolvedValue(45);

    const result = await checkRateLimit("test-key", 1, 60);

    expect(result).toEqual({ limited: true, retryAfter: 45, remaining: 0 });
  });

  it("falls back to windowSeconds when ttl returns a non-positive value", async () => {
    mockIncr.mockResolvedValue(2);
    mockTtl.mockResolvedValue(-1);

    const result = await checkRateLimit("test-key", 1, 60);

    expect(result.retryAfter).toBe(60);
  });

  it("fails open (allows the request) if Redis throws an error", async () => {
    mockIncr.mockRejectedValue(new Error("Redis connection lost"));

    const result = await checkRateLimit("test-key", 5, 60);

    expect(result).toEqual({ limited: false, retryAfter: 0, remaining: 5 });
  });
});
