import { Octokit } from "@octokit/rest";
import {
  getDiffPr,
  postPRComment,
  postInlineComment,
  updateCheckRun,
} from "./github";

import { AggregatorReview } from "./aggregator";
import { getValidDiffLines } from "../utils/Validate";
const emoji = (s: string) =>
  s === "critical" ? "🔴" : s === "warning" ? "🟡" : "🔵";
export async function publishReview(opts: {
  repo: string;
  prNumber: number;
  commitSha: string;
  checkRunId: number;
  review: AggregatorReview;
  octokit: Octokit;
}): Promise<number> {
  const { repo, prNumber, commitSha, checkRunId, review, octokit } = opts;
  const diff = await getDiffPr(repo, prNumber, octokit);

  const inlineFindings: typeof review.findings = [];
  const outOfDiff: typeof review.findings = [];

  for (const f of review.findings) {
    if (!f.line) continue;
    const patch = diff.find((d) => d.filename === f.file)?.patch;
    const valid = patch ? getValidDiffLines(patch) : new Set<number>();
    (valid.has(f.line) ? inlineFindings : outOfDiff).push(f);
  }

  let summary = review.summary;
  if (outOfDiff.length > 0) {
    summary += `\n\n---\n\n### Additional findings (outside this PR's diff)\n\n`;
    summary += outOfDiff
      .map(
        (f) =>
          `- ${emoji(f.severity)} **${f.severity.toUpperCase()}** — \`${f.file}:${f.line}\` — ${f.message}`,
      )
      .join("\n");
  }

  await Promise.allSettled(
    inlineFindings.map((f) =>
      postInlineComment(
        repo,
        prNumber,
        commitSha,
        f.line!,
        `${emoji(f.severity)} **${f.severity.toUpperCase()}** — ${f.message}`,
        f.file,
        octokit,
      ),
    ),
  );

  await updateCheckRun(repo, checkRunId, review, octokit);
  await postPRComment(repo, prNumber, summary, octokit);
  return inlineFindings.length;
}
