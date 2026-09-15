import Link from "next/link";
import { subMonths } from "date-fns";
import {
  PageHeader,
  AdminCard,
  AdminEmptyRow,
  AdminResponsiveList,
  AdminListCard,
} from "@/components/admin/ui";
import { ReportBatchFilter } from "@/components/admin/ReportBatchFilter";
import { ReportMonthPicker } from "@/components/admin/ReportMonthPicker";
import { getActiveBranchId, requireSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { buildAttendanceReport } from "@/lib/report-attendance";
import { parseReportMonth, reportMonthLabel } from "@/lib/report-month";
import { formatDate } from "@/lib/utils";

function trendLabel(trend: number | null) {
  if (trend == null) return "—";
  if (trend > 0) return `↑ ${trend}%`;
  if (trend < 0) return `↓ ${Math.abs(trend)}%`;
  return "→ 0%";
}

export default async function AttendanceReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; batch?: string }>;
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

      <AdminCard title="Members" description="Sorted by lowest attendance first. Unmarked = absent.">
        <AdminResponsiveList
          cards={
            report.members.length ? (
              report.members.map((m) => (
                <AdminListCard key={m.memberId}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/members/${m.memberId}`}
                        className="font-medium text-gray-900 underline-offset-2 hover:underline"
                      >
                        {m.name}
                      </Link>
                      <p className="text-xs text-[var(--admin-muted)]">{m.code}</p>
                      <p className="mt-1 text-xs text-[var(--admin-muted)]">
                        {m.batches.join(", ") || "—"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-[var(--admin-navy)]">
                        {m.pct != null ? `${m.pct}%` : "—"}
                      </p>
                      <p className="text-xs text-[var(--admin-muted)]">
                        {m.present}/{m.sessionsHeld}
                      </p>
                    </div>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-xs text-[var(--admin-muted)]">Last month</dt>
                      <dd>
                        {m.lastPct != null
                          ? `${m.lastPct}% (${m.lastPresent}/${m.lastSessionsHeld})`
                          : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[var(--admin-muted)]">Trend</dt>
                      <dd
                        className={
                          m.trend != null && m.trend > 0
                            ? "text-emerald-600"
                            : m.trend != null && m.trend < 0
                              ? "text-[var(--admin-red)]"
                              : undefined
                        }
                      >
                        {trendLabel(m.trend)}
                      </dd>
                    </div>
                  </dl>
                </AdminListCard>
              ))
            ) : (
              <AdminListCard>
                <p className="text-center text-sm text-[var(--admin-muted)]">
                  No members with batches for this filter.
                </p>
              </AdminListCard>
            )
          }
          table={
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Batch</th>
                  <th>Present</th>
                  <th>%</th>
                  <th>Last month</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                {report.members.map((m) => (
                  <tr key={m.memberId}>
                    <td>
                      <Link
                        href={`/admin/members/${m.memberId}`}
                        className="font-medium text-gray-900 underline-offset-2 hover:underline"
                      >
                        {m.name}
                      </Link>
                      <span className="ml-1 text-xs text-[var(--admin-muted)]">({m.code})</span>
                    </td>
                    <td>{m.batches.join(", ") || "—"}</td>
                    <td>
                      {m.present}/{m.sessionsHeld}
                    </td>
                    <td>{m.pct != null ? `${m.pct}%` : "—"}</td>
                    <td>
                      {m.lastPct != null
                        ? `${m.lastPct}% (${m.lastPresent}/${m.lastSessionsHeld})`
                        : "—"}
                    </td>
                    <td
                      className={
                        m.trend != null && m.trend > 0
                          ? "text-emerald-600"
                          : m.trend != null && m.trend < 0
                            ? "text-[var(--admin-red)]"
                            : undefined
                      }
                    >
                      {trendLabel(m.trend)}
                    </td>
                  </tr>
                ))}
                {!report.members.length ? (
                  <AdminEmptyRow colSpan={6} message="No members with batches for this filter." />
                ) : null}
              </tbody>
            </table>
          }
        />
      </AdminCard>

      <AdminCard title="Class log" description="Sessions taken this month">
        <AdminResponsiveList
          cards={
            report.sessions.length ? (
              report.sessions.map((s) => (
                <AdminListCard key={s.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{s.batchName}</p>
                      <p className="mt-0.5 text-xs text-[var(--admin-muted)]">{formatDate(s.date)}</p>
                    </div>
                    <p className="shrink-0 font-semibold text-[var(--admin-navy)]">
                      {s.present}/{s.marked}
                    </p>
                  </div>
                  <p className="mt-3 text-sm text-[var(--admin-muted)]">
                    Taken by {s.takenBy ?? "—"}
                  </p>
                </AdminListCard>
              ))
            ) : (
              <AdminListCard>
                <p className="text-center text-sm text-[var(--admin-muted)]">
                  No attendance sessions this month.
                </p>
              </AdminListCard>
            )
          }
          table={
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Batch</th>
                  <th>Present</th>
                  <th>Taken by</th>
                </tr>
              </thead>
              <tbody>
                {report.sessions.map((s) => (
                  <tr key={s.id}>
                    <td>{formatDate(s.date)}</td>
                    <td>{s.batchName}</td>
                    <td>
                      {s.present}/{s.marked}
                    </td>
                    <td>{s.takenBy ?? "—"}</td>
                  </tr>
                ))}
                {!report.sessions.length ? (
                  <AdminEmptyRow colSpan={4} message="No attendance sessions this month." />
                ) : null}
              </tbody>
            </table>
          }
        />
      </AdminCard>
    </div>
  );
}
