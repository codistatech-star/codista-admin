import { subMonths } from "date-fns";
import { PageHeader, AdminCard, AdminFillPage } from "@/components/admin/ui";
import { AttendanceReportPanel } from "@/components/admin/AttendanceReportPanel";
import { ReportBatchFilter } from "@/components/admin/ReportBatchFilter";
import { ReportMonthPicker } from "@/components/admin/ReportMonthPicker";
import { getActiveBranchId, requireSession } from "@/lib/auth-helpers";
import {
  parseAttendanceReportPage,
  parseAttendanceReportTab,
} from "@/lib/attendance-report-params";
import { prisma } from "@/lib/prisma";
import { buildAttendanceReport } from "@/lib/report-attendance";
import { parseReportMonth, reportMonthLabel } from "@/lib/report-month";

export default async function AttendanceReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; batch?: string; tab?: string; q?: string; page?: string }>;
}) {
  const user = await requireSession();
  const branchId = await getActiveBranchId(user);
  if (!branchId) {
    return (
      <div>
        <PageHeader title="Attendance report" />
        <p className="text-sm text-[var(--admin-muted)]">No branch</p>
      </div>
    );
  }

  const sp = await searchParams;
  const { month, start, end } = parseReportMonth(sp.month);
  const prevStart = subMonths(start, 1);
  const batchFilter = sp.batch?.trim() || null;
  const tab = parseAttendanceReportTab(sp.tab);
  const q = sp.q?.trim() ?? "";
  const page = parseAttendanceReportPage(sp.page);

  const [batches, members, sessionsThisMonth, sessionsLastMonth] = await Promise.all([
    prisma.batch.findMany({
      where: { isActive: true, OR: [{ branchId }, { branchId: null }] },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.member.findMany({
      where: {
        branchId,
        isActive: true,
        batches: { some: {} },
      },
      select: {
        id: true,
        name: true,
        code: true,
        batches: {
          select: {
            batchId: true,
            batch: { select: { name: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.attendanceSession.findMany({
      where: { branchId, date: { gte: start, lt: end } },
      include: {
        batch: { select: { name: true } },
        takenBy: { select: { name: true } },
        entries: { select: { memberId: true, isPresent: true } },
      },
    }),
    prisma.attendanceSession.findMany({
      where: { branchId, date: { gte: prevStart, lt: start } },
      include: {
        batch: { select: { name: true } },
        takenBy: { select: { name: true } },
        entries: { select: { memberId: true, isPresent: true } },
      },
    }),
  ]);

  const report = buildAttendanceReport({
    members,
    sessionsThisMonth,
    sessionsLastMonth,
    batchFilter,
  });

  const batchOptions = [
    { value: "", label: "All batches" },
    ...batches.map((b) => ({ value: b.id, label: b.name })),
  ];

  const sessionRows = report.sessions.map((s) => ({
    id: s.id,
    date: s.date.toISOString(),
    batchName: s.batchName,
    present: s.present,
    marked: s.marked,
    takenBy: s.takenBy,
  }));

  return (
    <AdminFillPage>
      <PageHeader
        className="!mb-3"
        title="Attendance report"
        description={`Member attendance — ${reportMonthLabel(start)}`}
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <ReportBatchFilter
              month={month}
              batch={batchFilter ?? ""}
              options={batchOptions}
            />
            <ReportMonthPicker month={month} />
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
            Overall attendance
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--admin-navy)]">
            {report.overallPct != null ? `${report.overallPct}%` : "—"}
          </p>
          <p className="mt-1 text-xs text-[var(--admin-muted)]">
            {report.totalPresentMarks}/{report.totalPossibleMarks} present marks
          </p>
        </AdminCard>
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
            Below 70%
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--admin-red)]">{report.below70}</p>
          <p className="mt-1 text-xs text-[var(--admin-muted)]">members</p>
        </AdminCard>
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
            Sessions held
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--admin-navy)]">{report.sessionsHeld}</p>
        </AdminCard>
      </div>

      <AttendanceReportPanel
        members={report.members}
        sessions={sessionRows}
        initialTab={tab}
        initialQ={q}
        initialPage={page}
      />
    </AdminFillPage>
  );
}
