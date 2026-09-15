"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AdminModal } from "./AdminModal";

export function AdminFormModal({
  title,
  trigger,
  triggerClassName,
  className,
  action,
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  title: string;
  trigger?: ReactNode;
  triggerClassName?: string;
  className?: string;
  action: (formData: FormData) => Promise<unknown>;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  function setOpen(next: boolean) {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
    if (!next) {
      setError(null);
      setFormKey((k) => k + 1);
    }
  }

  return (
    <AdminModal
      title={title}
      trigger={trigger}
      triggerClassName={triggerClassName}
      className={className}
      open={open}
      onOpenChange={setOpen}
    >
      <form
        key={formKey}
        className="space-y-3"
        action={async (fd) => {
          setError(null);
          try {
            await action(fd);
            setOpen(false);
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save");
          }
        }}
      >
        {children}
        {error ? <p className="text-sm text-[var(--admin-red)]">{error}</p> : null}
      </form>
    </AdminModal>
  );
}
