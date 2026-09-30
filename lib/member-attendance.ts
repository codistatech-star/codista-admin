import type { AttendanceBatchStat, AttendanceMemberStat } from "@/lib/report-attendance";
import { buildAttendanceReport } from "@/lib/report-attendance";
import { daysInReportMonth, parseReportMonth } from "@/lib/report-month";
import { prisma } from "@/lib/prisma";
import { subMonths } from "date-fns";

export type MemberPerformance = AttendanceMemberStat & {
  monthLabel: string;
  lastMonthLabel: string;
};

export async function getMemberPerformance(memberId: string): Promise<MemberPerformance | null> {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      name: true,
      code: true,
      branchId: true,
      batches: {
        select: {
          batchId: true,
          batch: { select: { name: true } },
        },
      },
    },
  });
  if (!member) return null;

  const { start, end, month } = parseReportMonth();
  const prevStart = subMonths(start, 1);
  const { month: lastMonth } = parseReportMonth(
    `${prevStart.getFullYear()}-${String(prevStart.getMonth() + 1).padStart(2, "0")}`,
  );

  const [sessionsThisMonth, sessionsLastMonth] = await Promise.all([
    prisma.attendanceSession.findMany({
      where: { branchId: member.branchId, date: { gte: start, lt: end } },
      select: {
        id: true,
        date: true,
        batchId: true,
        entries: { select: { memberId: true, isPresent: true } },
      },
    }),
    prisma.attendanceSession.findMany({
      where: { branchId: member.branchId, date: { gte: prevStart, lt: start } },
      select: {
        id: true,
        date: true,
        batchId: true,
        entries: { select: { memberId: true, isPresent: true } },
      },
    }),
  ]);

  const report = buildAttendanceReport({
    members: [member],
    sessionsThisMonth,
    sessionsLastMonth,
    daysInMonth: daysInReportMonth(start),
    lastDaysInMonth: daysInReportMonth(prevStart),
  });

  const stat = report.members[0];
  if (!stat) {
    return {
      memberId: member.id,
      name: member.name,
      code: member.code,
      batches: member.batches.map((b) => b.batch.name),
      byBatch: [] as AttendanceBatchStat[],
      present: 0,
      sessionsHeld: 0,
      pct: null,
      lastPresent: 0,
      lastSessionsHeld: 0,
      lastPct: null,
      trend: null,
      monthLabel: month,
      lastMonthLabel: lastMonth,
    };
  }

  return {
    ...stat,
    monthLabel: month,
    lastMonthLabel: lastMonth,
  };
}
