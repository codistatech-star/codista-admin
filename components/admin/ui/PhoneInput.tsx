"use client";

import { cn } from "@/lib/utils";

export function PhoneInput({
  name,
  defaultValue,
  required,
  className,
  id,
  label = "Mobile",
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
  id?: string;
  label?: string;
}) {
  const digitsOnly = (defaultValue ?? "").replace(/\D/g, "").slice(-10);

  return (
    <label className={cn("admin-label", className)} htmlFor={id ?? name}>
      {label}
      <div className="admin-phone mt-1">
        <span className="admin-phone-prefix" aria-hidden>
          +91
        </span>
        <input
          id={id ?? name}
          className="admin-phone-input"
          name={name}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={10}
          pattern="[0-9]{10}"
          title="Enter a 10-digit mobile number"
          placeholder="10-digit number"
          defaultValue={digitsOnly}
          required={required}
          onInput={(e) => {
            const el = e.currentTarget;
            el.value = el.value.replace(/\D/g, "").slice(0, 10);
          }}
        />
      </div>
    </label>
  );
}
