"use client";

import { type ReactNode } from "react";
import { AdminFormModal, SubmitButton } from "@/components/admin/ui";
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
  item?: StockItemDTO;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isEdit = Boolean(item);
  const resolvedTrigger = trigger !== undefined ? trigger : isEdit ? undefined : "Add item";

  return (
    <AdminFormModal
      title={isEdit ? `Edit — ${item!.name}` : "Add item"}
      trigger={resolvedTrigger}
      triggerClassName={triggerClassName}
      open={open}
      onOpenChange={onOpenChange}
      className="!max-w-lg"
      action={upsertStockItem}
    >
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <label className="admin-label">
        Item name
        <input
          className="admin-input mt-1"
          name="name"
          placeholder="e.g. Dobok - Daedo - XL"
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
      <label className="admin-label">
        {isEdit ? "Quantity" : "Opening quantity"}
        <input
          className="admin-input mt-1"
          name="quantity"
          type="number"
          min={0}
          defaultValue={item?.quantity ?? 0}
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

      <SubmitButton className="w-full">{isEdit ? "Save changes" : "Save item"}</SubmitButton>
    </AdminFormModal>
  );
}
