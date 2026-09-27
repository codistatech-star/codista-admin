import type { AttendancePunchStatus, AttendanceSource, KioskDevice } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { hashKioskToken } from "@/lib/kiosk-token";
import { getAcademySettings } from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { normalizeRfidUid } from "@/lib/rfid";

const DUPLICATE_WINDOW_MS = 15_000;

export type MarkAttendanceInput = {
  memberId: string;
  branchId: string;
  date: Date;
  batchId: string;
  isPresent: boolean;
  source?: AttendanceSource;
  takenById?: string | null;
};

export type KioskPunchMember = {
  name: string;
  code: string;
  photoUrl: string | null;
};

export type KioskPunchResult = {
  status: AttendancePunchStatus;
  message: string;
  member?: KioskPunchMember;
};

const PUNCH_MESSAGES: Record<AttendancePunchStatus, string> = {
  PRESENT: "Present",
  ALREADY_MARKED: "Already marked",
  DUPLICATE: "Already marked",
  UNKNOWN_CARD: "Unknown card",
  INACTIVE: "Member inactive",
  EXPIRED: "Membership expired",
  NO_BATCH: "No batch assigned",
};

/** Calendar date in IST as a UTC midnight Date (matches Prisma @db.Date usage). */
export function todayInIst(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return new Date(`${parts}T00:00:00.000Z`);
}

export async function assertMemberCanBeMarked(
  member: { isActive: boolean; membership: { validUntil: Date } | null },
  date: Date,
) {
  const settings = await getAcademySettings();
  if (!member.isActive) throw new Error("Member inactive");
  if (
    !settings.allowAttendanceWhenExpired &&
    member.membership &&
    member.membership.validUntil < date
  ) {
    throw new Error("Membership expired — attendance blocked by settings");
  }
}

export async function upsertAttendanceMark(input: MarkAttendanceInput) {
  const { memberId, branchId, date, batchId, isPresent, takenById } = input;
  const source = input.source ?? "MANUAL";

  const member = await prisma.member.findUniqueOrThrow({
    where: { id: memberId },
    include: { membership: true },
  });
  await assertMemberCanBeMarked(member, date);

  const session = await prisma.attendanceSession.upsert({
    where: { date_batchId_branchId: { date, batchId, branchId } },
    create: { date, batchId, branchId, takenById: takenById || null },
    update: takenById ? { takenById } : {},
  });

  const existing = await prisma.attendanceEntry.findUnique({
    where: { sessionId_memberId: { sessionId: session.id, memberId } },
  });

  await prisma.attendanceEntry.upsert({
    where: { sessionId_memberId: { sessionId: session.id, memberId } },
    create: { sessionId: session.id, memberId, isPresent, source },
    update: { isPresent, source, markedAt: new Date() },
  });

  return {
    sessionId: session.id,
    alreadyPresent: existing?.isPresent === true && isPresent,
  };
}

export async function markMemberPresent(
  input: Omit<MarkAttendanceInput, "isPresent">,
) {
  return upsertAttendanceMark({ ...input, isPresent: true });
}

function resolvePrimaryBatchId(
  batches: { batchId: string; isPrimary: boolean }[],
) {
  return batches.find((b) => b.isPrimary)?.batchId ?? batches[0]?.batchId ?? null;
}

function memberPayload(member: {
  name: string;
  code: string;
  photoUrl: string | null;
}): KioskPunchMember {
  return { name: member.name, code: member.code, photoUrl: member.photoUrl };
}

async function writePunch(input: {
  deviceId: string;
  branchId: string;
  rfidUid: string;
  status: AttendancePunchStatus;
  date: Date;
  memberId?: string | null;
  sessionId?: string | null;
}) {
  if (input.status === "DUPLICATE") return;
  await prisma.attendancePunch.create({
    data: {
      deviceId: input.deviceId,
      branchId: input.branchId,
      rfidUid: input.rfidUid,
      status: input.status,
      date: input.date,
      memberId: input.memberId ?? null,
      sessionId: input.sessionId ?? null,
    },
  });
  revalidatePath("/admin/settings/kiosk-devices");
}

export async function recordKioskPunch(input: {
  device: Pick<KioskDevice, "id" | "branchId">;
  uid: string;
}): Promise<KioskPunchResult> {
  const rfidUid = normalizeRfidUid(input.uid);
  const date = todayInIst();
  const now = new Date();

  await prisma.kioskDevice.update({
    where: { id: input.device.id },
    data: { lastSeenAt: now },
  });

  if (!rfidUid) {
    await writePunch({
      deviceId: input.device.id,
      branchId: input.device.branchId,
      rfidUid: "",
      status: "UNKNOWN_CARD",
      date,
    });
    return { status: "UNKNOWN_CARD", message: PUNCH_MESSAGES.UNKNOWN_CARD };
  }

  const recent = await prisma.attendancePunch.findFirst({
    where: {
      deviceId: input.device.id,
      rfidUid,
      punchedAt: { gte: new Date(now.getTime() - DUPLICATE_WINDOW_MS) },
    },
    orderBy: { punchedAt: "desc" },
  });
  if (recent) {
    const member = recent.memberId
      ? await prisma.member.findUnique({
          where: { id: recent.memberId },
          select: { name: true, code: true, photoUrl: true },
        })
      : null;
    return {
      status: "DUPLICATE",
      message: PUNCH_MESSAGES.DUPLICATE,
      member: member ? memberPayload(member) : undefined,
    };
  }

  const member = await prisma.member.findFirst({
    where: { rfidUid, branchId: input.device.branchId },
    include: { membership: true, batches: true },
  });

  if (!member) {
    await writePunch({
      deviceId: input.device.id,
      branchId: input.device.branchId,
      rfidUid,
      status: "UNKNOWN_CARD",
      date,
    });
    return { status: "UNKNOWN_CARD", message: PUNCH_MESSAGES.UNKNOWN_CARD };
  }

  const shown = memberPayload(member);

  if (!member.isActive) {
    await writePunch({
      deviceId: input.device.id,
      branchId: input.device.branchId,
      rfidUid,
      status: "INACTIVE",
      date,
      memberId: member.id,
    });
    return { status: "INACTIVE", message: PUNCH_MESSAGES.INACTIVE, member: shown };
  }

  const settings = await getAcademySettings();
  if (
    !settings.allowAttendanceWhenExpired &&
    member.membership &&
    member.membership.validUntil < date
  ) {
    await writePunch({
      deviceId: input.device.id,
      branchId: input.device.branchId,
      rfidUid,
      status: "EXPIRED",
      date,
      memberId: member.id,
    });
    return { status: "EXPIRED", message: PUNCH_MESSAGES.EXPIRED, member: shown };
  }

  const batchId = resolvePrimaryBatchId(member.batches);
  if (!batchId) {
    await writePunch({
      deviceId: input.device.id,
      branchId: input.device.branchId,
      rfidUid,
      status: "NO_BATCH",
      date,
      memberId: member.id,
    });
    return { status: "NO_BATCH", message: PUNCH_MESSAGES.NO_BATCH, member: shown };
  }

  const session = await prisma.attendanceSession.findUnique({
    where: {
      date_batchId_branchId: { date, batchId, branchId: input.device.branchId },
    },
    include: {
      entries: { where: { memberId: member.id } },
    },
  });
  if (session?.entries[0]?.isPresent) {
    await writePunch({
      deviceId: input.device.id,
      branchId: input.device.branchId,
      rfidUid,
      status: "ALREADY_MARKED",
      date,
      memberId: member.id,
      sessionId: session.id,
    });
    return {
      status: "ALREADY_MARKED",
      message: PUNCH_MESSAGES.ALREADY_MARKED,
      member: shown,
    };
  }

  const marked = await markMemberPresent({
    memberId: member.id,
    branchId: input.device.branchId,
    date,
    batchId,
    source: "RFID",
  });

  await writePunch({
    deviceId: input.device.id,
    branchId: input.device.branchId,
    rfidUid,
    status: "PRESENT",
    date,
    memberId: member.id,
    sessionId: marked.sessionId,
  });

  revalidatePath("/admin/attendance");
  revalidatePath("/admin/reports/attendance");

  return { status: "PRESENT", message: PUNCH_MESSAGES.PRESENT, member: shown };
}

export async function findKioskDeviceByToken(token: string) {
  return prisma.kioskDevice.findUnique({
    where: { tokenHash: hashKioskToken(token) },
  });
}
