import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-helpers";
import { isOurR2Url } from "@/lib/r2";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;

/** Same-origin fetch of member photos so the ID card can be saved as an image. */
export async function GET(req: Request) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = new URL(req.url).searchParams.get("url")?.trim() ?? "";
  if (!isOurR2Url(raw)) {
    return NextResponse.json({ error: "Image URL is not allowed" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(raw, { redirect: "manual" });
  } catch {
    return NextResponse.json({ error: "Could not load image" }, { status: 502 });
  }

  if (upstream.status >= 300 && upstream.status < 400) {
    return NextResponse.json({ error: "Image redirects are not allowed" }, { status: 400 });
  }
  if (!upstream.ok) {
    return NextResponse.json({ error: "Could not load image" }, { status: 502 });
  }

  const type = upstream.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
  if (!type.startsWith("image/")) {
    return NextResponse.json({ error: "URL is not an image" }, { status: 400 });
  }

  const buf = Buffer.from(await upstream.arrayBuffer());
  if (buf.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too large" }, { status: 413 });
  }

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": type,
      "Cache-Control": "private, max-age=300",
    },
  });
}
