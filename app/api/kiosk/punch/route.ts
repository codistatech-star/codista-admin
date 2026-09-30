import { NextResponse } from "next/server";
import { findKioskDeviceByPin, recordKioskPunch } from "@/lib/attendance";

function readPin(req: Request, bodyPin?: unknown) {
  const header = req.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (bearer) return bearer;
  if (typeof bodyPin === "string") return bodyPin.trim();
  return "";
}

export async function POST(req: Request) {
  let body: { uid?: unknown; pin?: unknown; token?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: "UNKNOWN_CARD", message: "Invalid request" }, { status: 400 });
  }

  const pin = readPin(req, body.pin ?? body.token);
  if (!pin) {
    return NextResponse.json({ status: "UNKNOWN_CARD", message: "Device PIN required" }, { status: 401 });
  }

  const device = await findKioskDeviceByPin(pin);
  if (!device || !device.isActive) {
    return NextResponse.json({ status: "UNKNOWN_CARD", message: "Invalid or revoked device" }, { status: 401 });
  }

  const uid = typeof body.uid === "string" ? body.uid : "";
  const result = await recordKioskPunch({ device, uid });
  return NextResponse.json(result);
}
