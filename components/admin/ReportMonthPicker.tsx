"use client";

import { Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { AdminMonthPicker } from "@/components/admin/ui/AdminMonthPicker";

function ReportMonthPickerInner({ month }: { month: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <AdminMonthPicker
      className="w-full sm:w-44"
      align="end"
      value={month}
      onChange={(next) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("month", next);
        router.push(`${pathname}?${params.toString()}`);
      }}
    />
  );
}

export function ReportMonthPicker({ month }: { month: string }) {
  return (
    <Suspense
      fallback={
        <div className="h-10 w-full animate-pulse rounded-lg border border-[var(--admin-border)] bg-gray-50 sm:w-44" />
      }
    >
      <ReportMonthPickerInner month={month} />
    </Suspense>
  );
}
