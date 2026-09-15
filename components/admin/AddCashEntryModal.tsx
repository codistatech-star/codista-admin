"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AdminModal,
  AdminSelect,
  AdminDatePicker,
  SubmitButton,
} from "@/components/admin/ui";
import { addCashEntry } from "@/app/(admin)/admin/cms-actions";

const EXPENSE_CATEGORIES = [
  { value: "Rent", label: "Rent" },
  { value: "Salary", label: "Salary" },
  { value: "Electricity", label: "Electricity" },
  { value: "Maintenance", label: "Maintenance" },
  { value: "Marketing", label: "Marketing" },
  { value: "Other", label: "Other" },
];

const INCOME_CATEGORIES = [
  { value: "Events", label: "Events" },
  { value: "Donation", label: "Donation" },
  { value: "Other", label: "Other" },
];

export function AddCashEntryModal({
  accountOptions,
  defaultDate,
}: {
  accountOptions: { value: string; label: string }[];
  defaultDate: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);
  const [entryType, setEntryType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [category, setCategory] = useState("Rent");
  const [customCategory, setCustomCategory] = useState("");

  const categoryOptions = entryType === "EXPENSE" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  function resetCategoryForType(type: "INCOME" | "EXPENSE") {
    setEntryType(type);
    setCategory(type === "EXPENSE" ? "Rent" : "Events");
    setCustomCategory("");
  }

  return (
    <AdminModal
      title="Add cash entry"
      trigger="Add entry"
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setError(null);
          setFormKey((k) => k + 1);
          resetCategoryForType("EXPENSE");
        }
      }}
    >
      <form
        key={formKey}
        className="space-y-3"
        action={(fd) => {
          setError(null);
          const resolved =
            category === "Other" ? customCategory.trim() : category;
          if (!resolved) {
            setError("Please enter a category");
            return;
          }
          fd.set("category", resolved);
          startTransition(async () => {
            try {
              await addCashEntry(fd);
              setOpen(false);
              setFormKey((k) => k + 1);
              resetCategoryForType("EXPENSE");
              router.refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to save entry");
            }
          });
        }}
      >
        <label className="admin-label">
          Type
          <AdminSelect
            className="mt-1"
            name="type"
            required
            value={entryType}
            onChange={(v) => resetCategoryForType(v as "INCOME" | "EXPENSE")}
            options={[
              { value: "EXPENSE", label: "Expense" },
              { value: "INCOME", label: "Income" },
            ]}
          />
        </label>
        <label className="admin-label">
          Account
          <AdminSelect className="mt-1" name="accountId" required options={accountOptions} />
        </label>
        <label className="admin-label">
          Amount
          <input className="admin-input mt-1" name="amount" type="number" placeholder="Amount" required />
        </label>
        <label className="admin-label">
          Category
          <AdminSelect
            className="mt-1"
            value={category}
            onChange={setCategory}
            options={categoryOptions}
          />
        </label>
        {category === "Other" ? (
          <label className="admin-label">
            Custom category
            <input
              className="admin-input mt-1"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Enter category"
              required
            />
          </label>
        ) : null}
        <label className="admin-label">
          Description
          <input className="admin-input mt-1" name="description" placeholder="Description" />
        </label>
        <label className="admin-label">
          Date
          <AdminDatePicker className="mt-1" name="entryDate" defaultValue={defaultDate} />
        </label>
        {error ? <p className="text-sm text-[var(--admin-red)]">{error}</p> : null}
        <SubmitButton className="w-full" disabled={pending}>
          {pending ? "Saving…" : "Save entry"}
        </SubmitButton>
      </form>
    </AdminModal>
  );
}
