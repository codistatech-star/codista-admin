"use client";

import { useState } from "react";
import { normalizeRfidUid } from "@/lib/rfid";

export function RfidCardField({ defaultValue = "" }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  const assigned = Boolean(value);

  return (
    <label className="admin-label md:col-span-2">
      RFID card
      <div className="mt-1 flex gap-2">
        <input
          className="admin-input font-mono"
          name="rfidUid"
          value={value}
          onChange={(e) => setValue(normalizeRfidUid(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
          placeholder="Tap a card here"
          autoComplete="off"
          spellCheck={false}
        />
        {assigned ? (
          <button
            type="button"
            className="btn-secondary !px-4 !py-2 text-xs"
            onClick={() => setValue("")}
          >
            Clear
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-[var(--admin-muted)]">
        {assigned
          ? "Card assigned. Tap another card to replace, or clear to unassign."
          : "Click the field and tap the USB reader to enroll."}
      </p>
    </label>
  );
}
