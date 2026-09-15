"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AdminModal } from "./AdminModal";
import { AdminButton } from "./primitives";

export function AdminConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  open,
  onOpenChange,
  onConfirm,
  danger = false,
  trigger,
  triggerClassName,
}: {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm: () => Promise<void> | void;
  danger?: boolean;
  trigger?: ReactNode;
  triggerClassName?: string;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolledOpen;

  function setOpen(next: boolean) {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
    if (!next) setError(null);
  }

  async function handleConfirm() {
    setError(null);
    setPending(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <AdminModal
      title={title}
      trigger={trigger}
      triggerClassName={triggerClassName}
      open={isOpen}
      onOpenChange={setOpen}
      className="!max-w-sm"
    >
      <div className="space-y-4">
        <div className="text-sm text-gray-700">{message}</div>
        {error ? <p className="text-sm text-[var(--admin-red)]">{error}</p> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <AdminButton
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            {cancelLabel}
          </AdminButton>
          <button
            type="button"
            disabled={pending}
            onClick={handleConfirm}
            className={cn(
              danger ? "btn-primary bg-[var(--admin-red)] hover:opacity-90" : "btn-primary",
              pending && "opacity-70",
            )}
          >
            {pending ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </AdminModal>
  );
}
