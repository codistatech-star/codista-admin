import Link from "next/link";
import type { MembershipStatus } from "@/lib/membership";
import { statusLabel } from "@/lib/membership";
import { cn } from "@/lib/utils";

const STATUS_ORDER: MembershipStatus[] = [
  "ACTIVE",
  "EXPIRING",
  "EXPIRED",
  "INACTIVE",
  "NONE",
];

const SEGMENT_CLASS: Record<MembershipStatus, string> = {
  ACTIVE: "bg-emerald-600",
  EXPIRING: "bg-amber-500",
  EXPIRED: "bg-red-600",
  INACTIVE: "bg-slate-500",
  NONE: "bg-slate-300",
};

const DOT_CLASS: Record<MembershipStatus, string> = {
  ACTIVE: "bg-emerald-600",
  EXPIRING: "bg-amber-500",
  EXPIRED: "bg-red-600",
  INACTIVE: "bg-slate-500",
  NONE: "bg-slate-300",
};

export type MemberStatusCounts = Record<MembershipStatus, number>;

export function MemberStatusSplit({ counts }: { counts: MemberStatusCounts }) {
  const total = STATUS_ORDER.reduce((sum, s) => sum + counts[s], 0);
  const segments = STATUS_ORDER.filter((s) => counts[s] > 0);

  return (
    <div>
      {total > 0 ? (
        <div
          className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-slate-100"
          role="img"
          aria-label={STATUS_ORDER.map(
            (s) => `${counts[s]} ${statusLabel(s).toLowerCase()}`,
          ).join(", ")}
        >
          {segments.map((s) => (
            <span
              key={s}
              className={cn("h-full", SEGMENT_CLASS[s])}
              style={{ width: `${(counts[s] / total) * 100}%` }}
            />
          ))}
        </div>
      ) : null}
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-700">
        {STATUS_ORDER.map((s) => (
          <li key={s}>
            <Link
              href={`/admin/members?status=${s}`}
              className="inline-flex items-center gap-1.5 hover:text-[var(--admin-navy)]"
            >
              <span
                className={cn("h-2 w-2 shrink-0 rounded-full", DOT_CLASS[s])}
                aria-hidden
              />
              <span>{statusLabel(s)}</span>
              <span className="font-semibold tabular-nums text-gray-900">{counts[s]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
