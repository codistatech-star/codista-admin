"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createKioskDevice } from "@/app/(admin)/admin/actions";
import { AdminModal, AdminSelect, SubmitButton } from "@/components/admin/ui";

export function CreateKioskDeviceModal({
  branches,
}: {
  branches: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setError(null);
    setToken(null);
    setCopied(false);
  }

  return (
    <AdminModal
      title={token ? "Copy device token" : "Add kiosk device"}
      trigger="Add device"
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          reset();
          router.refresh();
        }
      }}
    >
      {token ? (
        <div className="space-y-3 text-sm">
          <p className="text-gray-700">
            Copy this token into <code>/kiosk</code> or into the Windows agent config
            (<code>%ProgramData%\Codista\rfid-agent\appsettings.json</code>). You can also copy it later from the list.
          </p>
          <p className="break-all rounded-xl border border-[var(--admin-border)] bg-slate-50 px-3 py-2 font-mono text-xs">
            {token}
          </p>
          <button
            type="button"
            className="btn-secondary w-full"
            onClick={async () => {
              await navigator.clipboard.writeText(token);
              setCopied(true);
            }}
          >
            {copied ? "Copied" : "Copy token"}
          </button>
          <button
            type="button"
            className="btn-primary w-full"
            onClick={() => {
              setOpen(false);
              reset();
              router.refresh();
            }}
          >
            Done
          </button>
        </div>
      ) : (
        <form
          className="space-y-3"
          action={async (fd) => {
            setError(null);
            try {
              const created = await createKioskDevice(fd);
              setToken(created.token);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to create device");
            }
          }}
        >
          <label className="admin-label">
            Device name
            <input className="admin-input mt-1" name="name" placeholder="Main hall reader" required />
          </label>
          <label className="admin-label">
            Branch
            <AdminSelect
              className="mt-1"
              name="branchId"
              required
              placeholder="Select branch"
              options={branches.map((b) => ({ value: b.id, label: b.name }))}
            />
          </label>
          {error ? <p className="text-sm text-[var(--admin-red)]">{error}</p> : null}
          <SubmitButton className="w-full">Create device</SubmitButton>
        </form>
      )}
    </AdminModal>
  );
}
