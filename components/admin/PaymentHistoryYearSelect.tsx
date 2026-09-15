"use client";

import { Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { AdminSelect } from "@/components/admin/ui/AdminSelect";

function PaymentHistoryYearSelectInner({
  year,
  years,
}: {
  year: number;
  years: number[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <AdminSelect
      className="w-32"
      value={String(year)}
      onChange={(next) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("year", next);
        router.push(`${pathname}?${params.toString()}`);
      }}
      options={years.map((y) => ({ value: String(y), label: String(y) }))}
    />
  );
}

export function PaymentHistoryYearSelect({
  year,
  years,
}: {
  year: number;
  years: number[];
}) {
  return (
    <Suspense fallback={<div className="h-10 w-32 animate-pulse rounded-lg border border-[var(--admin-border)] bg-gray-50" />}>
      <PaymentHistoryYearSelectInner year={year} years={years} />
    </Suspense>
  );
}
