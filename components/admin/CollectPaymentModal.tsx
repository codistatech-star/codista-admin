"use client";

import { type ReactNode } from "react";
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
  open,
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
  return (
    <AdminModal
      title="Collect payment"
      trigger={trigger}
      triggerClassName={triggerClassName}
      open={open}
      onOpenChange={onOpenChange}
      className={className ?? "!max-w-lg"}
    >
      <CollectPaymentForm
        key={memberId ?? "pick"}
        members={members}
        memberId={memberId}
        onSuccess={onSuccess}
        redirectAfter={redirectAfter}
      />
    </AdminModal>
  );
}
