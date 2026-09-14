"use client";

import {
  addMonths,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  setMonth,
  setYear,
  startOfMonth,
  startOfWeek,
  subMonths,
  subYears,
} from "date-fns";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const YEAR_PAGE_SIZE = 12;

type PickerView = "day" | "month" | "year";

function parseYmd(value: string): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = parse(value, "yyyy-MM-dd", new Date());
  return Number.isNaN(d.getTime()) ? null : d;
}

function toYmd(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function decadeStart(year: number) {
  return Math.floor(year / YEAR_PAGE_SIZE) * YEAR_PAGE_SIZE;
}

export function AdminDatePicker({
  name,
  defaultValue,
  value: controlledValue,
  onChange,
  required,
  disabled,
  className,
  id,
  withTime = false,
  timeDefault = "00:00",
  fromYear = 1950,
  toYear,
}: {
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  /** When true, posts datetime-local style value (YYYY-MM-DDTHH:mm) */
  withTime?: boolean;
  timeDefault?: string;
  /** Earliest year shown in the year grid (default 1950). */
  fromYear?: number;
  /** Latest year shown in the year grid (default current year + 10). */
  toYear?: number;
}) {
  const reactId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const initial = controlledValue ?? defaultValue ?? "";
  const maxYear = toYear ?? new Date().getFullYear() + 10;

  const initialDatePart = withTime && initial.includes("T") ? initial.slice(0, 10) : initial.slice(0, 10);
  const initialTimePart =
    withTime && initial.includes("T") ? initial.slice(11, 16) : withTime ? timeDefault : "";

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<PickerView>("day");
  const [dateStr, setDateStr] = useState(initialDatePart);
  const [timeStr, setTimeStr] = useState(initialTimePart || timeDefault);
  const [viewMonth, setViewMonth] = useState(() => parseYmd(initialDatePart) ?? new Date());

  useEffect(() => {
    if (controlledValue === undefined) return;
    if (withTime && controlledValue.includes("T")) {
      setDateStr(controlledValue.slice(0, 10));
      setTimeStr(controlledValue.slice(11, 16));
    } else {
      setDateStr(controlledValue.slice(0, 10));
    }
  }, [controlledValue, withTime]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) setView("day");
  }, [open]);

  const selected = parseYmd(dateStr);
  const postedValue = withTime
    ? dateStr
      ? `${dateStr}T${timeStr || timeDefault}`
      : ""
    : dateStr;

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  const yearPageStart = decadeStart(viewMonth.getFullYear());
  const years = useMemo(() => {
    return Array.from({ length: YEAR_PAGE_SIZE }, (_, i) => yearPageStart + i).filter(
      (y) => y >= fromYear && y <= maxYear,
    );
  }, [yearPageStart, fromYear, maxYear]);

  function commitDate(d: Date) {
    const next = toYmd(d);
    setDateStr(next);
    setViewMonth(d);
    const full = withTime ? `${next}T${timeStr || timeDefault}` : next;
    onChange?.(full);
    if (!withTime) setOpen(false);
  }

  function commitTime(t: string) {
    setTimeStr(t);
    if (dateStr) onChange?.(`${dateStr}T${t}`);
  }

  function onHeaderLabelClick() {
    if (view === "day") setView("month");
    else if (view === "month") setView("year");
  }

  function onNav(delta: -1 | 1) {
    if (view === "day") {
      setViewMonth((m) => (delta < 0 ? subMonths(m, 1) : addMonths(m, 1)));
      return;
    }
    if (view === "month") {
      setViewMonth((m) => (delta < 0 ? subYears(m, 1) : addYears(m, 1)));
      return;
    }
    setViewMonth((m) => (delta < 0 ? subYears(m, YEAR_PAGE_SIZE) : addYears(m, YEAR_PAGE_SIZE)));
  }

  function pickMonth(monthIndex: number) {
    setViewMonth((m) => setMonth(m, monthIndex));
    setView("day");
  }

  function pickYear(year: number) {
    setViewMonth((m) => setYear(m, year));
    setView("month");
  }

  const headerLabel =
    view === "day"
      ? format(viewMonth, "MMMM yyyy")
      : view === "month"
        ? String(viewMonth.getFullYear())
        : `${yearPageStart} – ${yearPageStart + YEAR_PAGE_SIZE - 1}`;

  const navPrevLabel =
    view === "day" ? "Previous month" : view === "month" ? "Previous year" : "Previous years";
  const navNextLabel =
    view === "day" ? "Next month" : view === "month" ? "Next year" : "Next years";

  const display = selected
    ? withTime
      ? `${format(selected, "dd MMM yyyy")} ${timeStr}`
      : format(selected, "dd MMM yyyy")
    : withTime
      ? "Select date & time"
      : "Select date";

  return (
    <div ref={rootRef} className={cn("admin-datepicker", className)}>
      <input type="hidden" name={name} value={postedValue} required={required} />
      <button
        type="button"
        id={id ?? reactId}
        disabled={disabled}
        className={cn("admin-datepicker-trigger", !selected && "is-placeholder")}
        onClick={() => {
          if (disabled) return;
          setOpen((o) => !o);
          setView("day");
          if (selected) setViewMonth(selected);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span>{display}</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
          <path d="M2 6.5H14" stroke="currentColor" strokeWidth="1.25" />
          <path d="M5.5 2V4.5M10.5 2V4.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        </svg>
      </button>

      {open ? (
        <div className="admin-datepicker-popover" role="dialog">
          <div className="admin-datepicker-header">
            <button
              type="button"
              className="admin-datepicker-nav"
              onClick={() => onNav(-1)}
              aria-label={navPrevLabel}
            >
              ‹
            </button>
            <button
              type="button"
              className={cn("admin-datepicker-month", view !== "year" && "is-clickable")}
              onClick={onHeaderLabelClick}
              disabled={view === "year"}
              aria-label={
                view === "day" ? "Choose month" : view === "month" ? "Choose year" : undefined
              }
            >
              {headerLabel}
            </button>
            <button
              type="button"
              className="admin-datepicker-nav"
              onClick={() => onNav(1)}
              aria-label={navNextLabel}
            >
              ›
            </button>
          </div>

          {view === "day" ? (
            <>
              <div className="admin-datepicker-weekdays">
                {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="admin-datepicker-grid">
                {days.map((day) => {
                  const inMonth = isSameMonth(day, viewMonth);
                  const isSel = selected ? isSameDay(day, selected) : false;
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      className={cn(
                        "admin-datepicker-day",
                        !inMonth && "is-outside",
                        isSel && "is-selected",
                        isToday(day) && !isSel && "is-today",
                      )}
                      onClick={() => commitDate(day)}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}

          {view === "month" ? (
            <div className="admin-monthpicker-grid">
              {MONTHS.map((label, index) => {
                const isSel =
                  selected != null &&
                  selected.getFullYear() === viewMonth.getFullYear() &&
                  selected.getMonth() === index;
                const isCurrent =
                  new Date().getFullYear() === viewMonth.getFullYear() &&
                  new Date().getMonth() === index;
                return (
                  <button
                    key={label}
                    type="button"
                    className={cn(
                      "admin-datepicker-day admin-monthpicker-cell",
                      isSel && "is-selected",
                      isCurrent && !isSel && "is-today",
                    )}
                    onClick={() => pickMonth(index)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          ) : null}

          {view === "year" ? (
            <div className="admin-monthpicker-grid">
              {years.map((year) => {
                const isSel = selected?.getFullYear() === year;
                const isCurrent = new Date().getFullYear() === year;
                return (
                  <button
                    key={year}
                    type="button"
                    className={cn(
                      "admin-datepicker-day admin-monthpicker-cell",
                      isSel && "is-selected",
                      isCurrent && !isSel && "is-today",
                    )}
                    onClick={() => pickYear(year)}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
          ) : null}

          {withTime && view === "day" ? (
            <div className="admin-datepicker-time">
              <label className="admin-label">
                Time
                <input
                  type="time"
                  className="admin-input mt-1"
                  value={timeStr}
                  onChange={(e) => commitTime(e.target.value)}
                />
              </label>
              <button type="button" className="btn-primary mt-2 w-full" onClick={() => setOpen(false)}>
                Done
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
