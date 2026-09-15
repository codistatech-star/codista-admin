"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminCard, AdminStickyDock } from "@/components/admin/ui";
import { AttendanceClassLogList, type AttendanceClassLogRow } from "@/components/admin/AttendanceClassLogList";
import { AttendanceMembersList } from "@/components/admin/AttendanceMembersList";
import { AttendanceReportPager } from "@/components/admin/AttendanceReportPager";
import { AttendanceReportSearch } from "@/components/admin/AttendanceReportSearch";
import { AttendanceReportTabs } from "@/components/admin/AttendanceReportTabs";
import {
  ATTENDANCE_REPORT_PAGE_SIZE,
  type AttendanceReportTab,
} from "@/lib/attendance-report-params";
import type { AttendanceMemberStat } from "@/lib/report-attendance";
import { formatDate } from "@/lib/utils";

function replaceQuery(patch: { tab?: AttendanceReportTab; q?: string; page?: number }) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (patch.tab !== undefined) {
    if (patch.tab === "members") params.delete("tab");
    else params.set("tab", patch.tab);
  }
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
  sessions,
  initialTab,
  initialQ = "",
  initialPage = 1,
}: {
  members: AttendanceMemberStat[];
  sessions: AttendanceClassLogRow[];
  initialTab: AttendanceReportTab;
  initialQ?: string;
  initialPage?: number;
}) {
  const [tab, setTab] = useState<AttendanceReportTab>(initialTab);
  const [q, setQ] = useState(initialQ);
  const [page, setPage] = useState(initialPage);
  const pageSize = ATTENDANCE_REPORT_PAGE_SIZE;

  useEffect(() => {
    setTab(initialTab);
    setQ(initialQ);
    setPage(initialPage);
  }, [initialTab, initialQ, initialPage, members, sessions]);

  const filteredMembers = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return members;
    return members.filter((m) => {
      const haystack = [m.name, m.code, ...m.batches].join(" ").toLowerCase();
      return haystack.includes(needle);
    });
  }, [members, q]);

  const filteredSessions = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return sessions;
    return sessions.filter((s) => {
      const haystack = [s.batchName, s.takenBy ?? "", formatDate(s.date)].join(" ").toLowerCase();
      return haystack.includes(needle);
    });
  }, [sessions, q]);

  const activeTotal = tab === "members" ? filteredMembers.length : filteredSessions.length;
  const totalPages = Math.max(1, Math.ceil(activeTotal / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const pagedMembers = filteredMembers.slice(startIdx, startIdx + pageSize);
  const pagedSessions = filteredSessions.slice(startIdx, startIdx + pageSize);

  const description =
    tab === "members"
      ? "Sorted by lowest attendance first. Unmarked = absent."
      : "Sessions taken this month";

  const selectTab = useCallback((next: AttendanceReportTab) => {
    setTab(next);
    setQ("");
    setPage(1);
    replaceQuery({ tab: next, q: "", page: 1 });
  }, []);

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
        <AttendanceReportTabs active={tab} onSelect={selectTab} />
        <p className="text-sm text-[var(--admin-muted)]">{description}</p>
        <AttendanceReportSearch
          placeholder={
            tab === "members" ? "Search name / code / batch" : "Search batch / taken by / date"
          }
          value={q}
          onSearch={applySearch}
        />
      </AdminStickyDock>

      {tab === "members" ? (
        <AttendanceMembersList members={pagedMembers} />
      ) : (
        <AttendanceClassLogList sessions={pagedSessions} />
      )}

      <div className="mt-4">
        <AttendanceReportPager
          page={safePage}
          pageSize={pageSize}
          total={activeTotal}
          onPageChange={changePage}
        />
      </div>
    </AdminCard>
  );
}
