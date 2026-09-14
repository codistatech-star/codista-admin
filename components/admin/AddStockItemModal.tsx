"use client";

import { type ReactNode } from "react";
import { AdminModal, SubmitButton } from "@/components/admin/ui";
import { upsertStockItem } from "@/app/(admin)/admin/cms-actions";
import type { StockItemDTO } from "@/components/admin/stock-types";

export function AddStockItemModal({
  trigger,
  triggerClassName,
  item,
  open,
  onOpenChange,
}: {
  trigger?: ReactNode;
  triggerClassName?: string;
  /** When set, edits catalogue fields only (no first-variant block). */
  item?: StockItemDTO;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isEdit = Boolean(item);
  const resolvedTrigger = trigger !== undefined ? trigger : isEdit ? undefined : "Add item";

  return (
    <AdminModal
      title={isEdit ? `Edit — ${item!.name}` : "Add item"}
      trigger={resolvedTrigger}
      triggerClassName={triggerClassName}
      open={open}
      onOpenChange={onOpenChange}
      className="!w-[32rem]"
    >
      <form action={upsertStockItem} className="space-y-3">
        {item ? <input type="hidden" name="id" value={item.id} /> : null}
        <label className="admin-label">
          Item name
          <input
            className="admin-input mt-1"
            name="name"
            placeholder="e.g. Dobok"
            defaultValue={item?.name}
            required
          />
        </label>
        <label className="admin-label">
          SKU
          <input
            className="admin-input mt-1"
            name="sku"
            placeholder="Optional SKU"
            defaultValue={item?.sku ?? ""}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="admin-label">
            Sale price (₹)
            <input
              className="admin-input mt-1"
              name="salePrice"
              type="number"
              step="0.01"
              placeholder="0"
              defaultValue={item ? item.salePrice : undefined}
            />
          </label>
          <label className="admin-label">
            Cost price (₹)
            <input
              className="admin-input mt-1"
              name="costPrice"
              type="number"
              step="0.01"
              placeholder="0"
              defaultValue={item ? item.costPrice : undefined}
            />
          </label>
        </div>
        <label className="admin-label">
          Low stock at
          <input
            className="admin-input mt-1"
            name="lowStockAt"
            type="number"
            defaultValue={item?.lowStockAt ?? 5}
          />
        </label>

        {!isEdit ? (
          <div className="space-y-3 border-t border-[var(--admin-border)] pt-3">
            <p className="text-sm font-medium text-gray-900">First variant</p>
            <p className="text-xs text-[var(--admin-muted)]">
              Required so the item can be stocked and sold immediately. Leave size prices blank to
              use the item defaults.
            </p>
            <label className="admin-label">
              Variant label
              <input
                className="admin-input mt-1"
                name="variantLabel"
                placeholder="e.g. Size 160 / Standard"
                required
              />
            </label>
            <label className="admin-label">
              Opening quantity
              <input
                className="admin-input mt-1"
                name="variantQuantity"
                type="number"
                defaultValue={0}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="admin-label">
                Variant sale (₹)
                <input
                  className="admin-input mt-1"
                  name="variantSalePrice"
                  type="number"
                  step="0.01"
                  placeholder="Optional"
                />
              </label>
              <label className="admin-label">
                Variant cost (₹)
                <input
                  className="admin-input mt-1"
                  name="variantCostPrice"
                  type="number"
                  step="0.01"
                  placeholder="Optional"
                />
              </label>
            </div>
          </div>
        ) : null}

        <SubmitButton className="w-full">{isEdit ? "Save changes" : "Save item"}</SubmitButton>
      </form>
    </AdminModal>
  );
}
