import {
  AdminEmptyRow,
  AdminResponsiveList,
  AdminListCard,
} from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";

export type AttendanceClassLogRow = {
  id: string;
  date: string;
  batchName: string;
  present: number;
  marked: number;
  takenBy: string | null;
};

export function AttendanceClassLogList({ sessions }: { sessions: AttendanceClassLogRow[] }) {
  return (
    <AdminResponsiveList
      cards={
        sessions.length ? (
          sessions.map((s) => (
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
            {sessions.map((s) => (
              <tr key={s.id}>
                <td>{formatDate(s.date)}</td>
                <td>{s.batchName}</td>
                <td>
                  {s.present}/{s.marked}
                </td>
                <td>{s.takenBy ?? "—"}</td>
              </tr>
            ))}
            {!sessions.length ? (
              <AdminEmptyRow colSpan={4} message="No attendance sessions this month." />
            ) : null}
          </tbody>
        </table>
      }
    />
  );
}
