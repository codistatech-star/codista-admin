"use client";

import { useRef, useState, type ReactNode } from "react";
import { AdminModal, ConfirmDeleteButton, SubmitButton } from "@/components/admin/ui";
import { addStockVariant, deleteStockVariant } from "@/app/(admin)/admin/cms-actions";
import type { StockItemDTO } from "@/components/admin/stock-types";
import { cn, formatINR } from "@/lib/utils";

function VariantsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16M4 12h10M4 18h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function StockVariantsModal({
  item,
  trigger,
  triggerClassName,
}: {
  item: StockItemDTO;
  trigger?: ReactNode;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const qty = item.variants.reduce((n, v) => n + v.quantity, 0);

  async function handleAdd(formData: FormData) {
    setError(null);
    try {
      await addStockVariant(formData);
      formRef.current?.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add variant");
    }
  }

  return (
    <>
      <button
        type="button"
        className={cn(
          trigger ? "admin-link tabular-nums" : "admin-icon-btn",
          triggerClassName,
        )}
        title={
          trigger
            ? `${item.variants.length} variants, ${qty} in stock`
            : "Manage variants"
        }
        aria-label={
          trigger
            ? `View variants for ${item.name}: ${item.variants.length} variants, ${qty} in stock`
            : `Manage variants for ${item.name}`
        }
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        {trigger ?? <VariantsIcon />}
      </button>
      <AdminModal
        title={`Variants — ${item.name}`}
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setError(null);
        }}
        className="!max-w-lg"
      >
        <form ref={formRef} action={handleAdd} className="space-y-3" autoComplete="off">
          <input type="hidden" name="itemId" value={item.id} />
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="admin-label sm:col-span-2">
              Variant label
              <input
                className="admin-input mt-1"
                name="label"
                placeholder="e.g. Size 160 / Blue"
                required
              />
            </label>
            <label className="admin-label">
              Opening qty
              <input className="admin-input mt-1" name="quantity" type="number" min={0} defaultValue={0} />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="admin-label">
              Sale price (₹)
              <input
                className="admin-input mt-1"
                name="salePrice"
                type="number"
                step="0.01"
                placeholder="Optional"
              />
            </label>
            <label className="admin-label">
              Cost price (₹)
              <input
                className="admin-input mt-1"
                name="costPrice"
                type="number"
                step="0.01"
                placeholder="Optional"
              />
            </label>
          </div>
          <p className="text-xs text-[var(--admin-muted)]">
            Leave prices blank to use the item defaults ({formatINR(item.salePrice)} /{" "}
            {formatINR(item.costPrice)}).
          </p>
          {error ? <p className="text-sm text-[var(--admin-red)]">{error}</p> : null}
          <SubmitButton className="w-fit">Add variant</SubmitButton>
        </form>

        <div className="mt-5 border-t border-[var(--admin-border)] pt-4">
          <p className="mb-2 text-sm font-medium text-gray-900">
            {item.variants.length ? `Existing (${item.variants.length})` : "Existing variants"}
          </p>
          <ul className="max-h-56 divide-y divide-gray-100 overflow-y-auto text-sm">
            {item.variants.map((v) => {
              const sale = v.salePrice ?? item.salePrice;
              const cost = v.costPrice ?? item.costPrice;
              const usesDefault = v.salePrice == null && v.costPrice == null;
              return (
                <li key={v.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{v.label}</p>
                    <p className="text-xs text-[var(--admin-muted)]">
                      {v.quantity} in stock · sale {formatINR(sale)} · cost {formatINR(cost)}
                      {usesDefault ? " (item default)" : ""}
                    </p>
                  </div>
                  <form action={deleteStockVariant}>
                    <input type="hidden" name="id" value={v.id} />
                    <ConfirmDeleteButton
                      label="Remove"
                      pendingLabel="Removing…"
                      confirmMessage={
                        v.quantity > 0
                          ? `Remove “${v.label}”? ${v.quantity} in stock will be discarded.`
                          : `Remove “${v.label}”?`
                      }
                    />
                  </form>
                </li>
              );
            })}
            {!item.variants.length ? (
              <li className="py-2 text-[var(--admin-muted)]">No variants yet. Add one above.</li>
            ) : null}
          </ul>
        </div>
      </AdminModal>
    </>
  );
}
