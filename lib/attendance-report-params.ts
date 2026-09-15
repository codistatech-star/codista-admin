export type AttendanceReportTab = "members" | "class-log";

export const ATTENDANCE_REPORT_PAGE_SIZE = 50;

export function parseAttendanceReportTab(raw?: string | null): AttendanceReportTab {
  return raw === "class-log" ? "class-log" : "members";
}

export function parseAttendanceReportPage(raw?: string | null) {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}
