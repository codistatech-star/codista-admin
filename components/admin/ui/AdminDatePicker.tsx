"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function parseYmd(value: string): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = parse(value, "yyyy-MM-dd", new Date());
  return Number.isNaN(d.getTime()) ? null : d;
}

function toYmd(d: Date) {
  return format(d, "yyyy-MM-dd");
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
}) {
  const reactId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const initial = controlledValue ?? defaultValue ?? "";

  const initialDatePart = withTime && initial.includes("T") ? initial.slice(0, 10) : initial.slice(0, 10);
  const initialTimePart =
    withTime && initial.includes("T") ? initial.slice(11, 16) : withTime ? timeDefault : "";

  const [open, setOpen] = useState(false);
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
              onClick={() => setViewMonth((m) => subMonths(m, 1))}
              aria-label="Previous month"
            >
              ‹
            </button>
            <span className="admin-datepicker-month">{format(viewMonth, "MMMM yyyy")}</span>
            <button
              type="button"
              className="admin-datepicker-nav"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              aria-label="Next month"
            >
              ›
            </button>
          </div>
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
          {withTime ? (
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
