"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminCard, AdminStickyDock } from "@/components/admin/ui";
import { AttendanceMembersList } from "@/components/admin/AttendanceMembersList";
import { AttendanceReportPager } from "@/components/admin/AttendanceReportPager";
import { AttendanceReportSearch } from "@/components/admin/AttendanceReportSearch";
import { ATTENDANCE_REPORT_PAGE_SIZE } from "@/lib/attendance-report-params";
import type { AttendanceMemberStat } from "@/lib/report-attendance";

function replaceQuery(patch: { q?: string; page?: number }) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  params.delete("tab");
  if (patch.q !== undefined) {
    const trimmed = patch.q.trim();
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");
  }
  if (patch.page !== undefined) {
    if (patch.page <= 1) params.delete("page");
    else params.set("page", String(patch.page));
  }
  const qs = params.toString();
  const next = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(window.history.state, "", next);
}

export function AttendanceReportPanel({
  members,
  initialQ = "",
  initialPage = 1,
}: {
  members: AttendanceMemberStat[];
  initialQ?: string;
  initialPage?: number;
}) {
  const [q, setQ] = useState(initialQ);
  const [page, setPage] = useState(initialPage);
  const pageSize = ATTENDANCE_REPORT_PAGE_SIZE;

  useEffect(() => {
    setQ(initialQ);
    setPage(initialPage);
  }, [initialQ, initialPage, members]);

  const filteredMembers = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return members;
    return members.filter((m) => {
      const haystack = [m.name, m.code, ...m.batches].join(" ").toLowerCase();
      return haystack.includes(needle);
    });
  }, [members, q]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const pagedMembers = filteredMembers.slice(startIdx, startIdx + pageSize);

  const applySearch = useCallback((nextQ: string) => {
    setQ(nextQ);
    setPage(1);
    replaceQuery({ q: nextQ, page: 1 });
  }, []);

  const changePage = useCallback((nextPage: number) => {
    setPage(nextPage);
    replaceQuery({ page: nextPage });
  }, []);

  return (
    <AdminCard>
      <AdminStickyDock className="mb-4 rounded-lg bg-white">
        <AttendanceReportSearch
          placeholder="Search name / code / batch"
          value={q}
          onSearch={applySearch}
        />
      </AdminStickyDock>

      <AttendanceMembersList members={pagedMembers} />

      <div className="mt-4">
        <AttendanceReportPager
          page={safePage}
          pageSize={pageSize}
          total={filteredMembers.length}
          onPageChange={changePage}
        />
      </div>

      <p className="mt-4 text-xs text-[var(--admin-muted)]">
        Rates use full calendar days in the month (e.g. /30). Unmarked days count as absent.
        Sorted by lowest overall % first.
      </p>
    </AdminCard>
  );
}
