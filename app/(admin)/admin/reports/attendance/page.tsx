import {
  PageHeader,
  AdminCard,
  AdminEmptyRow,
  AdminResponsiveList,
  AdminListCard,
} from "@/components/admin/ui";
import { ReportMonthPicker } from "@/components/admin/ReportMonthPicker";
import { getActiveBranchId, requireSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { parseReportMonth, reportMonthLabel } from "@/lib/report-month";
import { formatDate } from "@/lib/utils";

export default async function AttendanceReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
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

  const sessions = await prisma.attendanceSession.findMany({
    where: { branchId, date: { gte: start, lt: end } },
    include: { takenBy: true, batch: true, entries: true },
    orderBy: { date: "desc" },
  });
  const present = sessions.reduce((n, s) => n + s.entries.filter((e) => e.isPresent).length, 0);
  const marked = sessions.reduce((n, s) => n + s.entries.length, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance report"
        description={`Sessions — ${reportMonthLabel(start)}`}
        actions={<ReportMonthPicker month={month} />}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">Sessions</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--admin-navy)]">{sessions.length}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">Present</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--admin-navy)]">
            {present}/{marked || 0}
          </p>
        </AdminCard>
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">Attendance</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--admin-navy)]">
            {marked ? `${Math.round((present / marked) * 100)}%` : "—"}
          </p>
        </AdminCard>
      </div>

      <AdminResponsiveList
        cards={
          sessions.length ? (
            sessions.map((s) => (
              <AdminListCard key={s.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{s.batch.name}</p>
                    <p className="mt-0.5 text-xs text-[var(--admin-muted)]">{formatDate(s.date)}</p>
                  </div>
                  <p className="shrink-0 font-semibold text-[var(--admin-navy)]">
                    {s.entries.filter((e) => e.isPresent).length}/{s.entries.length}
                  </p>
                </div>
                <p className="mt-3 text-sm text-[var(--admin-muted)]">
                  Taken by {s.takenBy?.name ?? "—"}
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
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td>{formatDate(s.date)}</td>
                  <td>{s.batch.name}</td>
                  <td>
                    {s.entries.filter((e) => e.isPresent).length}/{s.entries.length}
                  </td>
                  <td>{s.takenBy?.name ?? "—"}</td>
                </tr>
              ))}
              {!sessions.length ? (
                <AdminEmptyRow colSpan={4} message="No attendance sessions this month." />
              ) : null}
            </tbody>
          </table>
        }
      />
    </div>
  );
}
