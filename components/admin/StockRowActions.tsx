"use client";

import { useState } from "react";
import { AddStockItemModal } from "@/components/admin/AddStockItemModal";
import { StockVariantsModal } from "@/components/admin/StockVariantsModal";
import type { StockItemDTO } from "@/components/admin/stock-types";

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

export function StockRowActions({ item }: { item: StockItemDTO }) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="flex items-center gap-1.5">
      <StockVariantsModal item={item} />
      <button
        type="button"
        className="admin-icon-btn"
        title="Edit item"
        aria-label={`Edit ${item.name}`}
        onClick={() => setEditOpen(true)}
      >
        <EditIcon />
      </button>
      <AddStockItemModal item={item} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
