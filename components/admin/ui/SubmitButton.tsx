"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  variant = "primary",
  className,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "danger";
}) {
  const { pending } = useFormStatus();
  const variantClass =
    variant === "primary"
      ? "btn-primary"
      : variant === "danger"
        ? "text-xs font-semibold text-[var(--admin-red)] hover:underline disabled:opacity-50"
        : "btn-secondary";

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={cn(variantClass, pending && "opacity-70", className)}
      {...props}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

export function ConfirmDeleteButton({
  label = "Delete",
  confirmMessage = "Delete this item? This cannot be undone.",
  pendingLabel = "Deleting…",
  className,
}: {
  label?: string;
  confirmMessage?: string;
  pendingLabel?: string;
  className?: string;
}) {
  return (
    <SubmitButton
      variant="danger"
      pendingLabel={pendingLabel}
      className={className}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      {label}
    </SubmitButton>
  );
}
