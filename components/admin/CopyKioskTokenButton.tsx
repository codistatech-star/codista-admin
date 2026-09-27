"use client";

import { useState } from "react";

export function CopyKioskTokenButton({ token }: { token: string | null }) {
  const [copied, setCopied] = useState(false);

  if (!token) {
    return <span className="text-xs text-[var(--admin-muted)]">—</span>;
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <input
        readOnly
        value={token}
        className="admin-input min-w-0 flex-1 font-mono text-xs"
        onFocus={(e) => e.currentTarget.select()}
      />
      <button
        type="button"
        className="btn-secondary shrink-0 !px-3 !py-1.5 text-xs"
        onClick={async () => {
          await navigator.clipboard.writeText(token);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
