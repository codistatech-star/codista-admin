import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const fd = await req.formData();
  await prisma.trialLead.create({
    data: {
      name: String(fd.get("name") || ""),
      phone: String(fd.get("phone") || ""),
      program: String(fd.get("program") || "") || null,
      branch: String(fd.get("branch") || "") || null,
      message: String(fd.get("message") || "") || null,
    },
  });
  return NextResponse.json({ ok: true });
}
