"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AdminModal, AdminSelect } from "@/components/admin/ui";
import { recordStockMovements } from "@/app/(admin)/admin/cms-actions";
import {
  resolveVariantUnitPrice,
  type StockItemDTO,
  type StockMemberOption,
} from "@/components/admin/stock-types";
import { formatINR } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Line = {
  key: string;
  itemId: string;
  variantId: string;
  quantity: string;
  unitPrice: string;
};

function newLine(): Line {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    itemId: "",
    variantId: "",
    quantity: "1",
    unitPrice: "",
  };
}

export function RecordStockMovementModal({
  items,
  members,
  trigger = "Record movement",
  triggerClassName,
  disabled,
}: {
  items: StockItemDTO[];
  members: StockMemberOption[];
  trigger?: ReactNode;
  triggerClassName?: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("SALE");
  const [memberId, setMemberId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const itemOptions = useMemo(
    () => items.map((i) => ({ value: i.id, label: i.name })),
    [items],
  );

  const ticketTotal = useMemo(() => {
    return lines.reduce((sum, line) => {
      const qty = Math.abs(Number(line.quantity) || 0);
      const price = Number(line.unitPrice);
      if (!qty || !Number.isFinite(price)) return sum;
      return sum + qty * price;
    }, 0);
  }, [lines]);

  function updateLine(key: string, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function onItemChange(key: string, itemId: string) {
    updateLine(key, { itemId, variantId: "", unitPrice: "" });
  }

  function onVariantChange(key: string, variantId: string, itemId: string) {
    const item = items.find((i) => i.id === itemId);
    const variant = item?.variants.find((v) => v.id === variantId);
    const price = item ? resolveVariantUnitPrice(item, variant, type) : null;
    updateLine(key, {
      variantId,
      unitPrice: price == null ? "" : String(price),
    });
  }

  function onTypeChange(next: string) {
    setType(next);
    setLines((prev) =>
      prev.map((line) => {
        if (!line.itemId || !line.variantId) return { ...line, unitPrice: "" };
        const item = items.find((i) => i.id === line.itemId);
        const variant = item?.variants.find((v) => v.id === line.variantId);
        const price = item ? resolveVariantUnitPrice(item, variant, next) : null;
        return { ...line, unitPrice: price == null ? "" : String(price) };
      }),
    );
  }

  function resetForm() {
    setType("SALE");
    setMemberId("");
    setNotes("");
    setLines([newLine()]);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = lines.map((l) => ({
      itemId: l.itemId,
      variantId: l.variantId,
      quantity: Math.abs(Number(l.quantity) || 0),
      unitPrice: l.unitPrice === "" ? null : Number(l.unitPrice),
    }));

    if (!payload.length || payload.some((p) => !p.itemId || !p.variantId || !p.quantity)) {
      setError("Each line needs an item, variant, and quantity.");
      return;
    }

    const fd = new FormData();
    fd.set("type", type);
    if (memberId) fd.set("memberId", memberId);
    if (notes) fd.set("notes", notes);
    fd.set("lines", JSON.stringify(payload));

    startTransition(async () => {
      try {
        await recordStockMovements(fd);
        resetForm();
        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to record movement");
      }
    });
  }

  if (disabled) {
    return (
      <button type="button" className={cn(triggerClassName ?? "btn-primary", "opacity-50")} disabled>
        {trigger}
      </button>
    );
  }

  return (
    <AdminModal
      title="Record movement"
      trigger={trigger}
      triggerClassName={triggerClassName}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          resetForm();
        }
      }}
      className="!w-[44rem] max-w-[95vw]"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="admin-label">
              Type
              <AdminSelect
                className="mt-1"
                value={type}
                onChange={onTypeChange}
                required
                options={[
                  { value: "PURCHASE", label: "Purchase" },
                  { value: "SALE", label: "Sale" },
                  { value: "ISSUE", label: "Issue" },
                  { value: "DAMAGE", label: "Damage" },
                ]}
              />
            </label>
            <label className="admin-label">
              Member {type === "SALE" ? "(optional)" : ""}
              <AdminSelect
                className="mt-1"
                value={memberId}
                onChange={setMemberId}
                placeholder="None"
                options={members.map((m) => ({
                  value: m.id,
                  label: `${m.code} — ${m.name}`,
                }))}
              />
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">Lines</p>
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() => setLines((prev) => [...prev, newLine()])}
              >
                Add line
              </button>
            </div>

            {lines.map((line, index) => {
              const item = items.find((i) => i.id === line.itemId);
              const variantOptions =
                item?.variants.map((v) => ({
                  value: v.id,
                  label: `${v.label} (${v.quantity})`,
                })) ?? [];

              return (
                <div
                  key={line.key}
                  className="grid items-start gap-2 rounded-lg border border-[var(--admin-border)] p-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1.1fr)_5.25rem_6rem_2.5rem]"
                >
                  <label className="admin-label min-w-0">
                    {index === 0 ? "Item" : <span className="sr-only">Item</span>}
                    <AdminSelect
                      className="mt-1"
                      value={line.itemId}
                      onChange={(v) => onItemChange(line.key, v)}
                      placeholder="Select item"
                      required
                      options={itemOptions}
                    />
                  </label>
                  <label className="admin-label min-w-0">
                    {index === 0 ? "Variant" : <span className="sr-only">Variant</span>}
                    <AdminSelect
                      className="mt-1"
                      value={line.variantId}
                      onChange={(v) => onVariantChange(line.key, v, line.itemId)}
                      placeholder={item ? "Select variant" : "Pick item first"}
                      required
                      disabled={!line.itemId || !variantOptions.length}
                      options={variantOptions}
                    />
                  </label>
                  <label className="admin-label">
                    {index === 0 ? "Qty" : <span className="sr-only">Qty</span>}
                    <input
                      className="admin-input mt-1"
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                      required
                    />
                  </label>
                  <label className="admin-label">
                    {index === 0 ? "Unit ₹" : <span className="sr-only">Unit price</span>}
                    <input
                      className="admin-input mt-1"
                      type="number"
                      step="0.01"
                      value={line.unitPrice}
                      onChange={(e) => updateLine(line.key, { unitPrice: e.target.value })}
                      placeholder={type === "SALE" || type === "PURCHASE" ? "Price" : "—"}
                    />
                  </label>
                  <label className="admin-label">
                    {index === 0 ? (
                      <span aria-hidden className="invisible select-none">
                        Qty
                      </span>
                    ) : (
                      <span className="sr-only">Remove line</span>
                    )}
                    <button
                      type="button"
                      className="admin-icon-btn is-danger mt-1 !h-10 !w-10 shrink-0 !rounded-lg disabled:cursor-not-allowed disabled:opacity-40"
                      title="Remove line"
                      aria-label="Remove line"
                      disabled={lines.length === 1}
                      onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path
                          d="M18 6 6 18M6 6l12 12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </label>
                </div>
              );
            })}
          </div>

          <label className="admin-label">
            Notes
            <input
              className="admin-input mt-1"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
            />
          </label>

          {type === "SALE" || type === "PURCHASE" ? (
            <p className="text-sm font-semibold text-gray-900">
              Ticket total: {formatINR(ticketTotal)}
            </p>
          ) : null}

          {error ? <p className="text-sm text-[var(--admin-red)]">{error}</p> : null}

          <button type="submit" className="btn-primary w-full" disabled={pending}>
            {pending ? "Recording…" : "Record movement"}
          </button>
        </form>
    </AdminModal>
  );
}
