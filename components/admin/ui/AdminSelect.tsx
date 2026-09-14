"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

export function AdminSelect({
  name,
  options,
  placeholder,
  defaultValue,
  value: controlledValue,
  onChange,
  required,
  disabled,
  className,
  id,
}: {
  name?: string;
  options: Option[];
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}) {
  const isControlled = controlledValue !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? "");
  const selected = isControlled ? controlledValue : internal;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function setSelected(next: string) {
    if (!isControlled) setInternal(next);
    onChange?.(next);
    setOpen(false);
  }

  const selectedOption = options.find((o) => o.value === selected);
  const label =
    selectedOption?.label ??
    (placeholder !== undefined ? placeholder : selected ? selected : "Select…");
  const isPlaceholder = !selectedOption;

  const menuOptions: Option[] =
    placeholder !== undefined
      ? [{ value: "", label: placeholder }, ...options]
      : options;

  return (
    <div className={cn("admin-select", className)} ref={rootRef}>
      {name ? (
        <input
          className="admin-select-sr-input"
          tabIndex={-1}
          aria-hidden
          name={name}
          value={selected}
          required={required}
          onChange={() => {}}
          readOnly
        />
      ) : null}
      <button
        type="button"
        id={id}
        className="admin-select-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-required={required}
        onClick={() => {
          if (!disabled) setOpen((o) => !o);
        }}
      >
        <span className={isPlaceholder ? "text-[var(--admin-muted)]" : "text-gray-900"}>
          {label}
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
        <ul id={listId} role="listbox" className="admin-select-menu">
          {menuOptions.map((o) => {
            const isSelected = o.value === selected;
            return (
              <li key={o.value === "" ? "__placeholder__" : o.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  className={cn("admin-select-option", isSelected && "is-selected")}
                  onClick={() => setSelected(o.value)}
                >
                  {o.label}
                </button>
              </li>
            );
          })}
          {!options.length && placeholder === undefined ? (
            <li className="px-3 py-2 text-sm text-[var(--admin-muted)]">No options</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
