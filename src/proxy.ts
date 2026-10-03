import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
export async function proxy(req: NextRequest) {
  if (req.method !== "POST")
    return NextResponse.json(
      { message: "Method is not permitted" },
      { status: 405 },
    );
  const rawbody = await req.text();
  const signature = req.headers.get("x-hub-signature-256") ?? "";
  const hmac = crypto.createHmac("sha256", process.env.WEBHOOK_SECRET!);
  const digest = "sha256=" + hmac.update(rawbody).digest("hex");
  const a = Buffer.from(digest);
  const b = Buffer.from(signature);

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
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
