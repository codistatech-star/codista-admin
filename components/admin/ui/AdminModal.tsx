"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminModal({
  title,
  trigger,
  triggerClassName,
  children,
  className,
  open: controlledOpen,
  onOpenChange,
}: {
  title: string;
  trigger?: ReactNode;
  triggerClassName?: string;
  children: ReactNode;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  function setOpen(next: boolean) {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <>
      {trigger !== undefined ? (
        <button
          type="button"
          className={cn(triggerClassName ?? "btn-primary")}
          onClick={() => setOpen(true)}
        >
          {trigger}
        </button>
      ) : null}
      <dialog
        ref={dialogRef}
        className={cn("admin-modal", className)}
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === dialogRef.current) setOpen(false);
        }}
      >
        <div className="admin-modal-panel">
          <div className="admin-modal-header">
            <h2 id={titleId} className="admin-modal-title">
              {title}
            </h2>
            <button
              type="button"
              className="admin-modal-close"
              aria-label="Close"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>
          <div className="admin-modal-body">{children}</div>
        </div>
      </dialog>
    </>
  );
}
