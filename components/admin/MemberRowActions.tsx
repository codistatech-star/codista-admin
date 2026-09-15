"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CollectPaymentModal } from "@/components/admin/CollectPaymentModal";
import { AdminConfirmModal } from "@/components/admin/ui";
import { setMemberActive } from "@/app/(admin)/admin/actions";

function CollectIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PowerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2v10M18.4 6.6a8 8 0 11-12.8 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MemberRowActions({
  memberId,
  isActive,
}: {
  memberId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [collectOpen, setCollectOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const activateLabel = isActive ? "Deactivate" : "Activate";

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        className="admin-icon-btn"
        title="Collect payment"
        aria-label="Collect payment"
        onClick={() => setCollectOpen(true)}
      >
        <CollectIcon />
      </button>
      <CollectPaymentModal
        open={collectOpen}
        onOpenChange={setCollectOpen}
        memberId={memberId}
        redirectAfter={false}
        onSuccess={() => {
          setCollectOpen(false);
          router.refresh();
        }}
      />
      <button
        type="button"
        className={`admin-icon-btn ${isActive ? "is-danger" : ""}`}
        title={activateLabel}
        aria-label={activateLabel}
        onClick={() => setConfirmOpen(true)}
      >
        <PowerIcon />
      </button>
      <AdminConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={activateLabel}
        message={
          isActive
            ? "Deactivate this member? They will be marked inactive."
            : "Activate this member? They will be marked active again."
        }
        confirmLabel={activateLabel}
        danger={isActive}
        onConfirm={async () => {
          const fd = new FormData();
          fd.set("id", memberId);
          fd.set("isActive", isActive ? "false" : "true");
          await setMemberActive(fd);
          router.refresh();
        }}
      />
    </div>
  );
}
