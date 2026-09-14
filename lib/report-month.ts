import { addMonths, format, parse, startOfMonth } from "date-fns";

/** Parse `yyyy-MM` (or invalid/missing) → current month range `[start, end)`. */
export function parseReportMonth(raw?: string | null) {
  const now = new Date();
  let start = startOfMonth(now);

  if (raw && /^\d{4}-\d{2}$/.test(raw)) {
    const parsed = parse(`${raw}-01`, "yyyy-MM-dd", new Date());
    if (!Number.isNaN(parsed.getTime())) {
      start = startOfMonth(parsed);
    }
  }

  const end = addMonths(start, 1);
  const month = format(start, "yyyy-MM");
  return { month, start, end };
}

export function reportMonthLabel(start: Date) {
  return format(start, "MMMM yyyy");
}

export function currentReportMonth() {
  return format(startOfMonth(new Date()), "yyyy-MM");
}
