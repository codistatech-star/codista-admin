import { NextResponse } from "next/server";
import { findKioskDeviceByToken, recordKioskPunch } from "@/lib/attendance";

function readToken(req: Request, bodyToken?: unknown) {
  const header = req.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (bearer) return bearer;
  return typeof bodyToken === "string" ? bodyToken.trim() : "";
}

export async function POST(req: Request) {
  let body: { uid?: unknown; token?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: "UNKNOWN_CARD", message: "Invalid request" }, { status: 400 });
  }

  const token = readToken(req, body.token);
  if (!token) {
    return NextResponse.json({ status: "UNKNOWN_CARD", message: "Device token required" }, { status: 401 });
  }

  const device = await findKioskDeviceByToken(token);
  if (!device || !device.isActive) {
    return NextResponse.json({ status: "UNKNOWN_CARD", message: "Invalid or revoked device" }, { status: 401 });
  }

  const uid = typeof body.uid === "string" ? body.uid : "";
  const result = await recordKioskPunch({ device, uid });
  return NextResponse.json(result);
}
