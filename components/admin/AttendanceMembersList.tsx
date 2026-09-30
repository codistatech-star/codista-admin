import Link from "next/link";
import {
  AdminEmptyRow,
  AdminResponsiveList,
  AdminListCard,
} from "@/components/admin/ui";
import type { AttendanceBatchStat, AttendanceMemberStat } from "@/lib/report-attendance";
import { cn } from "@/lib/utils";

function trendLabel(trend: number | null) {
  if (trend == null) return "—";
  if (trend > 0) return `↑ ${trend}%`;
  if (trend < 0) return `↓ ${Math.abs(trend)}%`;
  return "→ 0%";
}

function barColor(pct: number | null) {
  if (pct == null) return "bg-slate-300";
  if (pct < 70) return "bg-[var(--admin-red)]";
  if (pct < 85) return "bg-amber-500";
  return "bg-emerald-600";
}

function BatchMiniBars({ batches }: { batches: AttendanceBatchStat[] }) {
  if (!batches.length) {
    return <span className="text-sm text-[var(--admin-muted)]">—</span>;
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {batches.map((b) => (
        <li key={b.batchId} className="min-w-0">
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="truncate font-medium text-gray-800">{b.name}</span>
            <span className="shrink-0 tabular-nums text-[var(--admin-muted)]">
              {b.present}/{b.sessionsHeld}
              <span className="ml-1.5 font-semibold text-gray-900">
                {b.pct != null ? `${b.pct}%` : "—"}
              </span>
            </span>
          </div>
          <div
            className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-slate-100"
            role="presentation"
            aria-hidden
          >
            <div
              className={cn("h-full rounded-full transition-[width]", barColor(b.pct))}
              style={{ width: `${b.pct != null ? Math.min(100, Math.max(0, b.pct)) : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
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
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold text-[var(--admin-navy)]">
                    {m.pct != null ? `${m.pct}%` : "—"}
                  </p>
                  <p className="text-xs text-[var(--admin-muted)]">
                    {m.present}/{m.sessionsHeld} overall
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <BatchMiniBars batches={m.byBatch} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--admin-border)] pt-3 text-sm">
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
              <th>Attendance by batch</th>
              <th>Overall</th>
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
                <td className="min-w-[14rem] max-w-sm">
                  <BatchMiniBars batches={m.byBatch} />
                </td>
                <td className="whitespace-nowrap">
                  <span className="font-semibold text-[var(--admin-navy)]">
                    {m.pct != null ? `${m.pct}%` : "—"}
                  </span>
                  <span className="ml-1.5 text-xs text-[var(--admin-muted)]">
                    {m.present}/{m.sessionsHeld}
                  </span>
                </td>
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
              <AdminEmptyRow colSpan={5} message="No members with batches for this filter." />
            ) : null}
          </tbody>
        </table>
      }
    />
  );
}
