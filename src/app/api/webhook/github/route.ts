import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { reviewQueue } from "../../../../../lib/queue";
import { getOctokit, postPlaceHolderComment } from "../../../../../lib/github";
export async function POST(req: NextRequest) {
  try {
    const rawbody = await req.text();
    const signature = req.headers.get("x-hub-signature-256") ?? "";
    console.log("THis is the signature=", signature);
    console.log("____+++++++++++++++++++++_______");
    console.log("this is the raw body= ", rawbody);
    console.log("Webhook Secret:", process.env.WEBHOOK_SECRET);
    console.log("Received Signature:", signature);
    // console.log("Computed Signature:", digest);
    console.log("Length Received:", Buffer.from(signature).length);
    // console.log("Length Computed:", Buffer.from(digest).length);
    const hmac = crypto.createHmac("sha256", process.env.WEBHOOK_SECRET!);

    const digest = "sha256=" + hmac.update(rawbody).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawbody);
    const event = req.headers.get("x-github-event");
    console.log("==============EVENT===========");
    console.log(event);
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
      const jobId = `${repo.replace("/", "-")}--${number}--${commitSha}`;
      const octokit = await getOctokit(installationId);
      const commentId = await postPlaceHolderComment(repo, number, octokit);
      console.log("AI started working", commentId);
      console.log("=====================JOBID=============");
      console.log(jobId);
      await reviewQueue.add(
        "review-pr",
        {
          repo,
          prNumber: number,
          commitSha,
          basesha: base.sha,
          title,
          installationId,
        },
        { jobId },
      );
      return NextResponse.json({ ok: true, jobId });
    }
    if (event === "issue_comment") {
      console.log("FULL PAYLOAD KEYS:", Object.keys(payload));
      console.log("comment:", payload.comment);
      console.log("issue:", payload.issue);
      console.log("repository:", payload.repository);
      console.log("installation:", payload.installation);
      const action = payload.action;
      const comment = payload.comment.body.trim();
      const sender = payload.comment.user.login;
      const isPR = payload.issue.pull_request;
      if (
        action !== "created" ||
        !isPR ||
        comment !== "/review" ||
        sender.includes("[bot]")
      ) {
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
      console.log(octokit);
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
    }
    if (event !== "pull_request" && event !== "issue_comment") {
      return NextResponse.json({
        message:
          "The following PR is neither a pull request or a issue comment",
        status: 200,
      });
    }
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(e.message);
    }
    return NextResponse.json({ message: e }, { status: 500 });
  }
}
