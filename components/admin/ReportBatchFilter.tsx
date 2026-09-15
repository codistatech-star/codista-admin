"use client";

import { Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { AdminSelect } from "@/components/admin/ui/AdminSelect";

function ReportBatchFilterInner({
  month,
  batch,
  options,
}: {
  month: string;
  batch: string;
  options: { value: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <AdminSelect
      className="w-full sm:w-48"
      value={batch}
      options={options}
      onChange={(next) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("month", month);
        if (next) params.set("batch", next);
        else params.delete("batch");
        params.delete("page");
        params.delete("q");
        router.push(`${pathname}?${params.toString()}`);
      }}
    />
  );
}

export function ReportBatchFilter({
  month,
  batch,
  options,
}: {
  month: string;
  batch: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Suspense
      fallback={
        <div className="h-10 w-full animate-pulse rounded-lg border border-[var(--admin-border)] bg-gray-50 sm:w-48" />
      }
    >
      <ReportBatchFilterInner month={month} batch={batch} options={options} />
    </Suspense>
  );
}
