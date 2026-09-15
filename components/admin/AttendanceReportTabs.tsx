"use client";

import { Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export type AttendanceReportTab = "members" | "class-log";

const TABS: { id: AttendanceReportTab; label: string }[] = [
  { id: "members", label: "Members" },
  { id: "class-log", label: "Class log" },
];

function AttendanceReportTabsInner({ active }: { active: AttendanceReportTab }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function selectTab(tab: AttendanceReportTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "members") params.delete("tab");
    else params.set("tab", tab);
    params.delete("page");
    params.delete("q");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

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
            onClick={() => selectTab(tab.id)}
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

export function AttendanceReportTabs({ active }: { active: AttendanceReportTab }) {
  return (
    <Suspense
      fallback={
        <div className="flex gap-1 border-b border-[var(--admin-border)]">
          <div className="h-9 w-20 animate-pulse rounded bg-gray-100" />
          <div className="h-9 w-24 animate-pulse rounded bg-gray-100" />
        </div>
      }
    >
      <AttendanceReportTabsInner active={active} />
    </Suspense>
  );
}

export function parseAttendanceReportTab(raw?: string | null): AttendanceReportTab {
  return raw === "class-log" ? "class-log" : "members";
}
