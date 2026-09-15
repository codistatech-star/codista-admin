"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AdminCheckbox,
  AdminConfirmModal,
  AdminFormModal,
  SubmitButton,
} from "@/components/admin/ui";
import {
  reactivateBranchAdmin,
  resetBranchAdminPassword,
  revokeBranchAdmin,
  updateBranchAdmin,
} from "@/app/(admin)/admin/actions";

export type UserRowBranchOption = { id: string; name: string };

export type UserRowUser = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  branchIds: string[];
};

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"
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

export function UserRowActions({
  user,
  branches,
}: {
  user: UserRowUser;
  branches: UserRowBranchOption[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const activateLabel = user.isActive ? "Deactivate" : "Activate";

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        className="admin-icon-btn"
        title="Edit user"
        aria-label={`Edit ${user.name}`}
        onClick={() => setEditOpen(true)}
      >
        <EditIcon />
      </button>
      <AdminFormModal
        title="Edit Branch Admin"
        open={editOpen}
        onOpenChange={setEditOpen}
        action={updateBranchAdmin}
      >
        <input type="hidden" name="id" value={user.id} />
        <label className="admin-label">
          Full name
          <input
            className="admin-input mt-1"
            name="name"
            defaultValue={user.name}
            placeholder="Full name"
            required
          />
        </label>
        <label className="admin-label">
          Email
          <input
            className="admin-input mt-1"
            name="email"
            type="email"
            defaultValue={user.email}
            placeholder="Email"
            required
          />
        </label>
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Branches</p>
          <div className="flex flex-wrap gap-3">
            {branches.map((b) => (
              <AdminCheckbox
                key={b.id}
                name="branchIds"
                value={b.id}
                label={b.name}
                defaultChecked={user.branchIds.includes(b.id)}
              />
            ))}
          </div>
        </div>
        <SubmitButton className="w-full">Save changes</SubmitButton>
      </AdminFormModal>

      <button
        type="button"
        className="admin-icon-btn"
        title="Reset password"
        aria-label={`Reset password for ${user.name}`}
        onClick={() => setResetOpen(true)}
      >
        <KeyIcon />
      </button>
      <AdminFormModal
        title="Reset password"
        open={resetOpen}
        onOpenChange={setResetOpen}
        action={resetBranchAdminPassword}
      >
        <input type="hidden" name="id" value={user.id} />
        <p className="text-sm text-[var(--admin-muted)]">
          Set a new temporary password for <span className="font-medium text-gray-900">{user.name}</span>.
        </p>
        <label className="admin-label">
          New temporary password
          <input
            className="admin-input mt-1"
            name="password"
            type="password"
            placeholder="Temporary password"
            required
            minLength={6}
          />
        </label>
        <SubmitButton className="w-full">Reset password</SubmitButton>
      </AdminFormModal>

      <button
        type="button"
        className={`admin-icon-btn ${user.isActive ? "is-danger" : ""}`}
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
          user.isActive
            ? "Deactivate this Branch Admin? They will not be able to sign in."
            : "Activate this Branch Admin? They will be able to sign in again."
        }
        confirmLabel={activateLabel}
        danger={user.isActive}
        onConfirm={async () => {
          const fd = new FormData();
          fd.set("id", user.id);
          if (user.isActive) await revokeBranchAdmin(fd);
          else await reactivateBranchAdmin(fd);
          router.refresh();
        }}
      />
    </div>
  );
}
