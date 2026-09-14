"use client";

import { format, parse } from "date-fns";
import { useEffect, useId, useRef, useState } from "react";
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

function parseYm(value: string): Date | null {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return null;
  const d = parse(`${value}-01`, "yyyy-MM-dd", new Date());
  return Number.isNaN(d.getTime()) ? null : d;
}

function toYm(d: Date) {
  return format(d, "yyyy-MM");
}

export function AdminMonthPicker({
  name,
  defaultValue,
  value: controlledValue,
  onChange,
  required,
  disabled,
  className,
  id,
  align = "start",
}: {
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  align?: "start" | "end";
}) {
  const reactId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const initial = controlledValue ?? defaultValue ?? toYm(new Date());
  const [open, setOpen] = useState(false);
  const [monthStr, setMonthStr] = useState(initial);
  const [viewYear, setViewYear] = useState(
    () => parseYm(initial)?.getFullYear() ?? new Date().getFullYear(),
  );

  useEffect(() => {
    if (controlledValue === undefined) return;
    setMonthStr(controlledValue);
    const d = parseYm(controlledValue);
    if (d) setViewYear(d.getFullYear());
  }, [controlledValue]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const selected = parseYm(monthStr);
  const display = selected ? format(selected, "MMMM yyyy") : "Select month";

  function commitMonth(monthIndex: number) {
    const next = toYm(new Date(viewYear, monthIndex, 1));
    setMonthStr(next);
    onChange?.(next);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={cn("admin-datepicker", className)}>
      <input type="hidden" name={name} value={monthStr} required={required} />
      <button
        type="button"
        id={id ?? reactId}
        disabled={disabled}
        className={cn("admin-datepicker-trigger", !selected && "is-placeholder")}
        onClick={() => {
          if (disabled) return;
          setOpen((o) => !o);
          if (selected) setViewYear(selected.getFullYear());
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
        <div
          className={cn("admin-datepicker-popover", align === "end" && "is-align-end")}
          role="dialog"
        >
          <div className="admin-datepicker-header">
            <button
              type="button"
              className="admin-datepicker-nav"
              onClick={() => setViewYear((y) => y - 1)}
              aria-label="Previous year"
            >
              ‹
            </button>
            <span className="admin-datepicker-month">{viewYear}</span>
            <button
              type="button"
              className="admin-datepicker-nav"
              onClick={() => setViewYear((y) => y + 1)}
              aria-label="Next year"
            >
              ›
            </button>
          </div>
          <div className="admin-monthpicker-grid">
            {MONTHS.map((label, index) => {
              const isSel =
                selected != null &&
                selected.getFullYear() === viewYear &&
                selected.getMonth() === index;
              const isCurrent =
                new Date().getFullYear() === viewYear && new Date().getMonth() === index;
              return (
                <button
                  key={label}
                  type="button"
                  className={cn(
                    "admin-datepicker-day admin-monthpicker-cell",
                    isSel && "is-selected",
                    isCurrent && !isSel && "is-today",
                  )}
                  onClick={() => commitMonth(index)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
