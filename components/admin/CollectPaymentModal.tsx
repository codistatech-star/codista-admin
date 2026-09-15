"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AdminModal } from "@/components/admin/ui";
import {
  CollectPaymentForm,
  type CollectMemberOption,
} from "@/components/admin/CollectPaymentForm";

export function CollectPaymentModal({
  trigger,
  triggerClassName,
  members,
  memberId,
  open: controlledOpen,
  onOpenChange,
  onSuccess,
  redirectAfter,
  className,
}: {
  trigger?: ReactNode;
  triggerClassName?: string;
  members?: CollectMemberOption[];
  memberId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: (result: { receiptNo: string; memberCode?: string }) => void;
  redirectAfter?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  function setOpen(next: boolean) {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  }

  return (
    <AdminModal
      title="Collect payment"
      trigger={trigger}
      triggerClassName={triggerClassName}
      open={open}
      onOpenChange={setOpen}
      className={className ?? "!max-w-lg"}
    >
      <CollectPaymentForm
        key={memberId ?? "pick"}
        members={members}
        memberId={memberId}
        onSuccess={(result) => {
          setOpen(false);
          onSuccess?.(result);
          if (redirectAfter !== false && !onSuccess) {
            router.refresh();
          }
        }}
        redirectAfter={false}
      />
    </AdminModal>
  );
}
