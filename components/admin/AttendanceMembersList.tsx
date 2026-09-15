import Link from "next/link";
import {
  AdminEmptyRow,
  AdminResponsiveList,
  AdminListCard,
} from "@/components/admin/ui";
import type { AttendanceMemberStat } from "@/lib/report-attendance";

function trendLabel(trend: number | null) {
  if (trend == null) return "—";
  if (trend > 0) return `↑ ${trend}%`;
  if (trend < 0) return `↓ ${Math.abs(trend)}%`;
  return "→ 0%";
}

export function AttendanceMembersList({ members }: { members: AttendanceMemberStat[] }) {
  return (
    <AdminResponsiveList
      cards={
        members.length ? (
          members.map((m) => (
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
            {members.map((m) => (
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
            {!members.length ? (
              <AdminEmptyRow colSpan={6} message="No members with batches for this filter." />
            ) : null}
          </tbody>
        </table>
      }
    />
  );
}
