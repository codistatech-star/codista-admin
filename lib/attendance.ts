import type { AttendancePunchStatus, AttendanceSource, KioskDevice } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { hashKioskPin } from "@/lib/kiosk-token";
import { getAcademySettings } from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { normalizeRfidUid } from "@/lib/rfid";

const DUPLICATE_WINDOW_MS = 3_000;
const PUNCH_RETENTION_DAYS = 3;
const PURGE_THROTTLE_MS = 60 * 60 * 1000;

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
  DUPLICATE: "Please wait",
  UNKNOWN_CARD: "Unknown card",
  INACTIVE: "Member inactive",
  EXPIRED: "Membership expired",
  NO_BATCH: "Member not mapped to any batch",
  OUTSIDE_WINDOW: "Outside class time",
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

/** "YYYY-MM-DD" for IST today (date pickers). */
export function todayIstYmd(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Minutes since midnight in IST. */
export function minutesNowIst(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

/** Parse "HH:mm" to minutes since midnight, or null. */
export function parseHhMm(value: string | null | undefined) {
  if (!value) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function formatBatchWindow(startTime?: string | null, endTime?: string | null) {
  if (!startTime || !endTime) return null;
  return `${startTime}–${endTime} IST`;
}

export function isWithinBatchWindow(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
  now = new Date(),
) {
  const start = parseHhMm(startTime);
  const end = parseHhMm(endTime);
  if (start == null || end == null || start >= end) return false;
  const mins = minutesNowIst(now);
  return mins >= start && mins <= end;
}

export type MappedBatchForPunch = {
  batchId: string;
  isPrimary: boolean;
  batch: {
    id: string;
    name: string;
    isActive: boolean;
    startTime: string | null;
    endTime: string | null;
  };
};

export type ResolveBatchResult =
  | { kind: "ok"; batchId: string }
  | { kind: "NO_BATCH" }
  | { kind: "OUTSIDE_WINDOW" };

export function resolveBatchForPunch(
  batches: MappedBatchForPunch[],
  now = new Date(),
): ResolveBatchResult {
  const active = batches.filter((b) => b.batch.isActive);
  if (!active.length) return { kind: "NO_BATCH" };

  const inWindow = active.filter((b) =>
    isWithinBatchWindow(b.batch.startTime, b.batch.endTime, now),
  );
  if (!inWindow.length) return { kind: "OUTSIDE_WINDOW" };

  inWindow.sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    const as = parseHhMm(a.batch.startTime) ?? 0;
    const bs = parseHhMm(b.batch.startTime) ?? 0;
    return as - bs;
  });
  return { kind: "ok", batchId: inWindow[0].batchId };
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
    include: {
      membership: true,
      batches: {
        include: {
          batch: {
            select: {
              id: true,
              name: true,
              isActive: true,
              startTime: true,
              endTime: true,
            },
          },
        },
      },
    },
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

  const resolved = resolveBatchForPunch(member.batches, now);
  if (resolved.kind === "NO_BATCH") {
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
  if (resolved.kind === "OUTSIDE_WINDOW") {
    await writePunch({
      deviceId: input.device.id,
      branchId: input.device.branchId,
      rfidUid,
      status: "OUTSIDE_WINDOW",
      date,
      memberId: member.id,
    });
    return {
      status: "OUTSIDE_WINDOW",
      message: PUNCH_MESSAGES.OUTSIDE_WINDOW,
      member: shown,
    };
  }

  const batchId = resolved.batchId;

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

export async function findKioskDeviceByPin(pin: string) {
  return prisma.kioskDevice.findUnique({
    where: { tokenHash: hashKioskPin(pin) },
  });
}

/** @deprecated use findKioskDeviceByPin */
export async function findKioskDeviceByToken(token: string) {
  return findKioskDeviceByPin(token);
}

/** Delete punches older than retention; throttled via AcademySettings.punchesPurgedAt. */
export async function purgeOldAttendancePunches() {
  const settings = await prisma.academySettings.findUnique({ where: { id: "default" } });
  const last = settings?.punchesPurgedAt?.getTime() ?? 0;
  if (Date.now() - last < PURGE_THROTTLE_MS) return;

  const cutoff = new Date(Date.now() - PUNCH_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.attendancePunch.deleteMany({
    where: { punchedAt: { lt: cutoff } },
  });
  await prisma.academySettings.update({
    where: { id: "default" },
    data: { punchesPurgedAt: new Date() },
  });
}
