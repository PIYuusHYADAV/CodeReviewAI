import { describe, it, expect } from "vitest";
import { getValidDiffLines } from "../utils/Validate";

describe("getValidDiffLines", () => {
  it("returns the correct line numbers for a simple added line", () => {
    const patch = `@@ -1,3 +1,4 @@
 line one
+new line here
 line two
 line three`;

    const result = getValidDiffLines(patch);

    expect(result.has(2)).toBe(true);
    expect(result.size).toBe(1);
  });

  it("returns an empty set for an empty patch", () => {
    const result = getValidDiffLines("");
    expect(result.size).toBe(0);
  });

  it("does not include removed lines", () => {
    const patch = `@@ -1,3 +1,2 @@
 kept line
-removed line
 another kept line`;

    const result = getValidDiffLines(patch);

    expect(result.size).toBe(0);
  });

  it("handles multiple hunks in one patch", () => {
    const patch = `@@ -1,2 +1,3 @@
 line one
+added in first hunk
 line two
@@ -10,2 +11,3 @@
 line ten
+added in second hunk
 line eleven`;

    const result = getValidDiffLines(patch);

    expect(result.has(2)).toBe(true);
    expect(result.has(12)).toBe(true);
    expect(result.size).toBe(2);
  });
});
