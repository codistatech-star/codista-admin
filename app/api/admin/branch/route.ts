import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { ACTIVE_BRANCH_COOKIE } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const branchId = String(body.branchId ?? "");
  if (!branchId) {
    return NextResponse.json({ error: "branchId required" }, { status: 400 });
  }
  const allowed =
    session.user.role === Role.ADMIN || session.user.branchIds.includes(branchId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const res = NextResponse.json({ ok: true, branchId });
  res.cookies.set(ACTIVE_BRANCH_COOKIE, branchId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
