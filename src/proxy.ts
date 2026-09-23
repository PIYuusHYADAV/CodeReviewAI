import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
export async function proxy(req: NextRequest) {
  console.log(req);
  if (req.method !== "POST")
    return NextResponse.json(
      { message: "Method is not permitted" },
      { status: 405 },
    );
  const rawbody = await req.text();
  console.log("Raw body====", rawbody);
  const signature = req.headers.get("x-hub-signature-256") ?? "";
  const hmac = crypto.createHmac("sha256", process.env.WEBHOOK_SECRET!);
  const digest = "sha256=" + hmac.update(rawbody).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(
    "x-verified-body",
    Buffer.from(rawbody, "utf-8").toString("base64"),
  );
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}
export const config = {
  matcher: "/api/webhook/github",
};
