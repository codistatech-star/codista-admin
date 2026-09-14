"use client";

import { cn } from "@/lib/utils";

export function AdminCheckbox({
  name,
  value,
  defaultChecked,
  checked,
  onChange,
  label,
  className,
  id,
}: {
  name?: string;
  value?: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const controlled = checked !== undefined;
  const inputId = id ?? (name && value ? `${name}-${value}` : undefined);

  return (
    <label className={cn("admin-checkbox", className)} htmlFor={inputId}>
      <input
        id={inputId}
        type="checkbox"
        name={name}
        value={value}
        className="admin-checkbox-input"
        {...(controlled ? { checked, onChange } : { defaultChecked, onChange })}
      />
      <span className="admin-checkbox-box" aria-hidden>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M2.5 6.5L5 9L9.5 3.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {label ? <span className="admin-checkbox-label">{label}</span> : null}
    </label>
  );
}
