"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { AdminSelect } from "@/components/admin/ui";

export function BranchSwitcher({
  branches,
  activeBranchId,
}: {
  branches: { id: string; name: string }[];
  activeBranchId?: string;
}) {
  const { update } = useSession();
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-[var(--admin-muted)]">Branch</span>
      <AdminSelect
        className="max-w-[220px]"
        disabled={pending || branches.length === 0}
        value={activeBranchId ?? ""}
        options={branches.map((b) => ({ value: b.id, label: b.name }))}
        onChange={(id) => {
          if (!id || id === activeBranchId) return;
          start(async () => {
            const res = await fetch("/api/admin/branch", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ branchId: id }),
            });
            if (!res.ok) return;
            await update({ activeBranchId: id });
            router.refresh();
          });
        }}
      />
    </label>
  );
}
