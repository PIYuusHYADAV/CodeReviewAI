import { NextRequest, NextResponse } from "next/server";

import { reviewQueue } from "../../../../../lib/queue";
import {
  createCheckRun,
  getOctokit,
  postPlaceHolderComment,
  updateCheckRun,
} from "../../../../../lib/github";

import { insertData, updateStatus } from "../../../../../repository/dbrepo";
import { checkKey, getCachedResult } from "../../../../../utils/redisutils";
import { AggregatorReview } from "../../../../../lib/aggregator";

export async function POST(req: NextRequest) {
  try {
    const encodedBody = req.headers.get("x-verified-body") ?? "";
    const rawbody = Buffer.from(encodedBody, "base64").toString("utf-8");
    const payload = JSON.parse(rawbody);
    const event = req.headers.get("x-github-event");

    if (event === "pull_request") {
      const action = payload.action;
      if (!["opened", "synchronize"].includes(action)) {
        return NextResponse.json({ ok: true });
      }
      const { number, head, base, title } = payload.pull_request;
      if (
        title.toLowerCase().includes("[wip]") ||
        title.toLowerCase().includes("[skip-review]") ||
        title.toLowerCase().startsWith("wip:") ||
        title.toLowerCase().startsWith("draft:")
      ) {
        console.log("Skipping review for:", title);
        return NextResponse.json({ ok: true, message: "Review skipped" });
      }

      const installationId = payload.installation?.id;
      const repo = payload.repository.full_name;
      const commitSha = head.sha;

      const octokit = await getOctokit(installationId);
      const { data: commit } = await octokit.git.getCommit({
        owner: repo.split("/")[0],
        repo: repo.split("/")[1],
        commit_sha: commitSha,
      });
      const treeSha = commit.tree.sha;
      const eventKey = `${repo}--${treeSha}`;
      const [commentId, checkRunId] = await Promise.all([
        postPlaceHolderComment(repo, number, octokit),
        createCheckRun(repo, commitSha, octokit),
      ]);
      if (await checkKey(eventKey)) {
        const res = await getCachedResult(eventKey);

        await updateCheckRun(repo, checkRunId, res, octokit);
        return NextResponse.json({ ok: true, cached: true, eventKey });
      }
      const result = await insertData(
        repo,
        treeSha,
        number,
        commitSha,
        base.sha,
        title,
        installationId,
        checkRunId,
      );
      if (result?.status == "completed" && result?.data) {
        await updateCheckRun(
          repo,
          checkRunId,
          result.data as AggregatorReview,
          octokit,
        );
        return NextResponse.json({
          ok: true,
          cached: true,
          source: "postgres",
        });
      } else if (result?.status == "processing") {
        return NextResponse.json({
          ok: true,
          message: "Request is already queued",
          status: "processing",
        });
      }

      const jobId = `${repo}--${treeSha}`;
      console.log("add in queue", jobId);
      Promise.all([
        reviewQueue.add(
          "review-pr",
          {
            repo,
            prNumber: number,
            commitSha,
            basesha: base.sha,
            title,
            installationId,

            checkRunId,
          },
          { jobId },
        ),
        updateStatus(repo, treeSha),
      ]);

      return NextResponse.json({ ok: true, jobId });
    } else if (event === "issue_comment") {
      const action = payload.action;
      const comment = payload.comment.body.trim();
      const sender = payload.comment.user.login;
      const isPR = payload.issue.pull_request;
      if (sender.includes("aicodereview001[bot]")) {
        return NextResponse.json({ ok: true, message: "Ignored bot comment" });
      }

      if (action !== "created" || !isPR || comment !== "/review") {
        return NextResponse.json({ ok: true, message: "Ignored Comment" });
      }

      const repo = payload.repository.full_name;

      const prNumber = payload.issue.number;
      const installationId = payload.installation?.id;
      console.log("repo,prNumber,installationID", {
        repo,
        prNumber,
        installationId,
      });

      if (!repo || !prNumber || !installationId) {
        console.log("Missing fields:", { repo, prNumber, installationId });
        return NextResponse.json({
          ok: true,
          message: "Missing required fields",
        });
      }
      const octokit = await getOctokit(installationId);

      const { data: pr } = await octokit.pulls.get({
        owner: repo.split("/")[0],
        repo: repo.split("/")[1],
        pull_number: prNumber,
      });

      const commitSha = pr.head.sha;
      const jobId = `${repo}--${prNumber}--${commitSha}--manual`;
      await reviewQueue.add(
        "review-pr",
        {
          repo,
          prNumber,
          commitSha,
          baseSha: pr.base.sha,
          title: pr.title,
          installationId,
        },
        { jobId },
      );

      return NextResponse.json({ ok: true, jobId, trigger: "manual" });
    } else {
      return NextResponse.json({
        message:
          "The following PR is neither a pull request or a issue comment",
        status: 200,
      });
    }
  } catch (e) {
    console.log(e);
    if (e instanceof Error) {
      throw new Error(e.message);
    }
    return NextResponse.json({ message: e }, { status: 500 });
  }
}
