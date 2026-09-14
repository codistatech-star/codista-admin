"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

export function AdminMultiSelect({
  name,
  options,
  defaultValue = [],
  value: controlledValue,
  onChange,
  placeholder = "Select…",
  className,
  id,
}: {
  name: string;
  options: Option[];
  defaultValue?: string[];
  value?: string[];
  onChange?: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}) {
  const isControlled = controlledValue !== undefined;
  const [internal, setInternal] = useState<string[]>(defaultValue);
  const selected = isControlled ? controlledValue : internal;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function setSelected(next: string[]) {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  }

  function toggle(value: string) {
    setSelected(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value],
    );
  }

  const labels = options.filter((o) => selected.includes(o.value)).map((o) => o.label);
  const summary =
    labels.length === 0
      ? placeholder
      : labels.length <= 2
        ? labels.join(", ")
        : `${labels.length} selected`;

  return (
    <div className={cn("admin-multiselect", className)} ref={rootRef}>
      {selected.map((v) => (
        <input key={v} type="hidden" name={name} value={v} />
      ))}
      <button
        type="button"
        id={id}
        className="admin-multiselect-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={labels.length ? "text-gray-900" : "text-[var(--admin-muted)]"}>
          {summary}
        </span>
        <span className="admin-select-chevron" aria-hidden>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 4.5L6 8L9.5 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      {open ? (
        <ul id={listId} role="listbox" aria-multiselectable className="admin-multiselect-menu">
          {options.map((o) => {
            const checked = selected.includes(o.value);
            return (
              <li key={o.value} role="option" aria-selected={checked}>
                <button
                  type="button"
                  className={cn("admin-multiselect-option", checked && "is-selected")}
                  onClick={() => toggle(o.value)}
                >
                  <span className={cn("admin-checkbox-box", checked && "is-checked")} aria-hidden>
                    {checked ? (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2.5 6.5L5 9L9.5 3.5"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                  </span>
                  {o.label}
                </button>
              </li>
            );
          })}
          {!options.length ? (
            <li className="px-3 py-2 text-sm text-[var(--admin-muted)]">No options</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
