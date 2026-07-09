import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { reviewQueue } from "../../../../../lib/queue";
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
    if (event !== "pull_request")
      return NextResponse.json(
        { message: "It is not a Pull request" },
        { status: 200 },
      );
    const action = payload.action;
    if (!["opened", "synchronize"].includes(action)) {
      return NextResponse.json({ ok: true });
    }
    const { number, head, base, title } = payload.pull_request;
    const installationId = payload.installation?.id;
    const repo = payload.repository.full_name;
    const commitSha = head.sha;
    const jobId = `${repo}:${number}:${commitSha}`;
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
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(e.message);
    }
    return NextResponse.json({ message: e }, { status: 500 });
  }
}
