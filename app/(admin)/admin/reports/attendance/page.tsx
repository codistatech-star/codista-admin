import { subMonths } from "date-fns";
import { PageHeader, AdminCard } from "@/components/admin/ui";
import { AttendanceClassLogList } from "@/components/admin/AttendanceClassLogList";
import { AttendanceMembersList } from "@/components/admin/AttendanceMembersList";
import {
  AttendanceReportPager,
  ATTENDANCE_REPORT_PAGE_SIZE,
  parseAttendanceReportPage,
} from "@/components/admin/AttendanceReportPager";
import { AttendanceReportSearch } from "@/components/admin/AttendanceReportSearch";
import {
  AttendanceReportTabs,
  parseAttendanceReportTab,
} from "@/components/admin/AttendanceReportTabs";
import { ReportBatchFilter } from "@/components/admin/ReportBatchFilter";
import { ReportMonthPicker } from "@/components/admin/ReportMonthPicker";
import { getActiveBranchId, requireSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { buildAttendanceReport } from "@/lib/report-attendance";
import { parseReportMonth, reportMonthLabel } from "@/lib/report-month";
import { formatDate } from "@/lib/utils";

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
  const q = sp.q?.trim().toLowerCase() ?? "";
  const page = parseAttendanceReportPage(sp.page);
  const pageSize = ATTENDANCE_REPORT_PAGE_SIZE;

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

  const filteredMembers = q
    ? report.members.filter((m) => {
        const haystack = [m.name, m.code, ...m.batches].join(" ").toLowerCase();
        return haystack.includes(q);
      })
    : report.members;

  const sessionRows = report.sessions.map((s) => ({
    id: s.id,
    date: s.date.toISOString(),
    batchName: s.batchName,
    present: s.present,
    marked: s.marked,
    takenBy: s.takenBy,
  }));

  const filteredSessions = q
    ? sessionRows.filter((s) => {
        const haystack = [s.batchName, s.takenBy ?? "", formatDate(s.date)].join(" ").toLowerCase();
        return haystack.includes(q);
      })
    : sessionRows;

  const activeTotal = tab === "members" ? filteredMembers.length : filteredSessions.length;
  const totalPages = Math.max(1, Math.ceil(activeTotal / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const pagedMembers = filteredMembers.slice(startIdx, startIdx + pageSize);
  const pagedSessions = filteredSessions.slice(startIdx, startIdx + pageSize);

  const description =
    tab === "members"
      ? "Sorted by lowest attendance first. Unmarked = absent."
      : "Sessions taken this month";

  return (
    <div className="space-y-6">
      <PageHeader
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

      <AdminCard>
        <div className="mb-4 space-y-3">
          <AttendanceReportTabs active={tab} />
          <p className="text-sm text-[var(--admin-muted)]">{description}</p>
          <AttendanceReportSearch
            placeholder={
              tab === "members"
                ? "Search name / code / batch"
                : "Search batch / taken by / date"
            }
            defaultValue={sp.q ?? ""}
          />
        </div>

        {tab === "members" ? (
          <AttendanceMembersList members={pagedMembers} />
        ) : (
          <AttendanceClassLogList sessions={pagedSessions} />
        )}

        <div className="mt-4">
          <AttendanceReportPager page={safePage} pageSize={pageSize} total={activeTotal} />
        </div>
      </AdminCard>
    </div>
  );
}
