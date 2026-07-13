import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import fs from "fs";
import path from "path";
import { AggregatorReview, runAggregator } from "./aggregator";
export type PRFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch: string;
};
export type PullRequestDetails = {
  title: string;
  description: string;
  author: string;
  baseBranch: string;
  headBranch: string;
};
let privateKey: string;
export async function createCheckRun(
  repo: string,
  commitSha: string,
  octokit: Octokit,
): Promise<number> {
  try {
    const [owner, reponame] = repo.split("/");
    const { data } = await octokit.checks.create({
      owner,
      repo: reponame,
      name: "CodeReview AI",
      head_sha: commitSha,
      status: "in_progress",
      started_at: new Date().toISOString(),
      output: {
        title: "⏳ Review in progress..",
        summary:
          "Running 4 specialized agents — 🔒 Security · ⚡ Performance · ✏️ Style · 🏛️ Architecture",
      },
    });
    return data.id;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Unidentified Error");
  }
}
export async function updateCheckRun(
  repo: string,
  checkRunId: number,
  review: AggregatorReview,
  octokit: Octokit,
) {
  try {
    const [owner, repoName] = repo.split("/");
    const criticalCount = review.findings.filter(
      (f) => f.severity === "critical",
    ).length;
    const warningCount = review.findings.filter(
      (f) => f.severity === "warning",
    ).length;
    const infoCount = review.findings.filter(
      (f) => f.severity === "info",
    ).length;
    const passed = review.overallScore >= 7 && criticalCount == 0;
    const conclusion =
      criticalCount > 0
        ? "failure"
        : review.overallScore >= 7
          ? "success"
          : "neutral";
    await octokit.checks.update({
      owner,
      repo: repoName,
      check_run_id: checkRunId,
      status: "completed",
      conclusion,
      completed_at: new Date().toISOString(),
      output: {
        title: `Score: ${review.overallScore}/10 — ${criticalCount} critical · ${warningCount} warnings · ${infoCount} info`,
        summary: review.summary,
        text: review.findings
          .map(
            (f) =>
              `**[${f.severity.toUpperCase()}]** \`${f.file}${f.line ? `:${f.line}` : ""}\` — ${f.message}`,
          )
          .join("\n\n"),
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Unidentified Error");
  }
}
export async function postPlaceHolderComment(
  repo: string,
  prNumber: number,
  octokit: Octokit,
): Promise<number> {
  try {
    const [owner, repoName] = repo.split("/");
    const { data } = await octokit.issues.createComment({
      owner,
      repo: repoName,
      issue_number: prNumber,
      body: `## 🤖 CodeReview AI\n\n⏳ **Review in progress...**\n\nRunning 4 specialized agents in parallel:\n\n- 🔒 Security\n- ⚡ Performance\n- ✏️ Style\n- 🏛️ Architecture\n\n_This comment will be displayed with findings shortly._\n For best result modularize your code upto the best.`,
    });
    return data.id;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Unidentified Error");
  }
}
export async function getOctokit(installationId: number): Promise<Octokit> {
  console.log(installationId);
  const pemPath = path.resolve(
    process.cwd(),
    "aicodereview001.2026-07-09.private-key.pem",
  );

  if (fs.existsSync(pemPath)) {
    privateKey = fs.readFileSync(pemPath, "utf-8");
  } else {
    privateKey = process.env.privatekey!.replace(/\\n/g, "\n");
  }
  const auth = createAppAuth({
    appId: process.env.APP_ID!,
    privateKey,
  });
  const { token } = await auth({
    type: "installation",
    installationId,
  });
  return new Octokit({ auth: token });
}
export async function postPRComment(
  repo: string,
  prNumber: number,
  body: string,
  octokit: Octokit,
): Promise<void> {
  try {
    const [owner, repoName] = repo.split("/");
    await octokit.issues.createComment({
      owner,
      repo: repoName,
      issue_number: prNumber,
      body,
    });
  } catch (error) {
    if (error instanceof Error) throw new Error(error.message);
    throw new Error("Unidentifed Error");
  }
}
export async function postInlineComment(
  repo: string,
  prNumber: number,
  commitSha: string,
  line: number,
  body: string,
  path: string,
  octokit: Octokit,
) {
  try {
    const [owner, repoName] = repo.split("/");
    await octokit.pulls.createReviewComment({
      owner,
      repo: repoName,
      pull_number: prNumber,
      commit_id: commitSha,
      path,
      line,
      body,
    });
  } catch (error) {
    if (error instanceof Error) throw new Error(error.message);
    throw new Error("Unidentified Error");
  }
}
export const fileContents = async (
  diff: PRFile[],
  repo: string,
  commitsha: string,
  octokit: Octokit,
) => {
  return Promise.all(
    diff
      .filter((f) => f.status !== "removed")
      .map(async (f) => {
        const content = await getContent(repo, f.filename, commitsha, octokit);
        return {
          filename: f.filename,
          path: f.filename,
          status: f.status,
          content,
        };
      }),
  );
};
export async function getDiffPr(
  repo: string,
  prNumber: number,
  octokit: Octokit,
): Promise<PRFile[]> {
  try {
    const [owner, repoName] = repo.split("/");
    const { data } = await octokit.pulls.listFiles({
      owner,
      repo: repoName,
      pull_number: prNumber,
    });

    return data.map((f) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      patch: f.patch ?? "",
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Unidentified Error");
  }
}

export async function getPrDetails(
  repo: string,
  prNumber: number,
  octokit: Octokit,
): Promise<PullRequestDetails> {
  try {
    const [owner, repoName] = repo.split("/");
    const { data: pr } = await octokit.pulls.get({
      owner,
      repo: repoName,
      pull_number: prNumber,
    });

    return {
      title: pr.title,
      description: pr.body ?? "",
      author: pr.user?.login ?? "",
      baseBranch: pr.base.ref,
      headBranch: pr.head.ref,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Unidentified Error");
  }
}

export async function getContent(
  repo: string,
  filePath: string,
  ref: string,
  octokit: Octokit,
) {
  try {
    const [owner, repoName] = repo.split("/");
    const { data } = await octokit.repos.getContent({
      owner,
      repo: repoName,
      path: filePath,
      ref,
    });
    if ("content" in data && typeof data.content === "string") {
      return Buffer.from(data.content, "base64").toString("utf-8");
    }
    return "";
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    return "";
  }
}
