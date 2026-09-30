import type { AttendanceBatchStat } from "@/lib/report-attendance";
import { cn } from "@/lib/utils";

function barColor(pct: number | null) {
  if (pct == null) return "bg-slate-300";
  if (pct < 70) return "bg-[var(--admin-red)]";
  if (pct < 85) return "bg-amber-500";
  return "bg-emerald-600";
}

export function BatchMiniBars({ batches }: { batches: AttendanceBatchStat[] }) {
  if (!batches.length) {
    return <span className="text-sm text-[var(--admin-muted)]">—</span>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {batches.map((b) => (
        <li key={b.batchId} className="min-w-0">
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="truncate font-medium text-gray-800">
              {b.name}{" "}
              <span className="font-normal tabular-nums text-[var(--admin-muted)]">
                ({b.present}/{b.sessionsHeld})
              </span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-gray-900">
              {b.pct != null ? `${b.pct}%` : "—"}
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
