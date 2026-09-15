"use client";

import { cn } from "@/lib/utils";
import type { AttendanceReportTab } from "@/lib/attendance-report-params";

const TABS: { id: AttendanceReportTab; label: string }[] = [
  { id: "members", label: "Members" },
  { id: "class-log", label: "Class log" },
];

export function AttendanceReportTabs({
  active,
  onSelect,
}: {
  active: AttendanceReportTab;
  onSelect: (tab: AttendanceReportTab) => void;
}) {
  return (
    <div className="flex gap-1 border-b border-[var(--admin-border)]" role="tablist" aria-label="Attendance report views">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(tab.id)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition",
              isActive
                ? "border-[var(--admin-navy)] text-[var(--admin-navy)]"
                : "border-transparent text-[var(--admin-muted)] hover:text-gray-900",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
