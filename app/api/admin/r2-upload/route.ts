import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-helpers";
import { isR2Configured, uploadR2Object, type R2Folder } from "@/lib/r2";

export const runtime = "nodejs";

const MAX_BYTES = 4 * 1024 * 1024; // 4MB after client crop

function parseFolder(raw: FormDataEntryValue | null): R2Folder | null {
  const value = String(raw || "");
  if (value === "gallery" || value === "achievements" || value === "leadership") return value;
  return null;
}

export async function POST(req: Request) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isR2Configured()) {
    return NextResponse.json(
      { error: "Cloudflare R2 is not configured. Add R2_* env vars." },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const folder = parseFolder(form.get("folder"));
  const file = form.get("file");
  if (!folder) {
    return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Image file is required" }, { status: 400 });
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, or WebP allowed" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 4MB)" }, { status: 400 });
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const result = await uploadR2Object({
      folder,
      contentType: file.type,
      body: bytes,
    });
    return NextResponse.json({ publicUrl: result.publicUrl, key: result.key });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 },
    );
  }
}
