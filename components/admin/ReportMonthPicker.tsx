"use client";

import { useRouter, usePathname } from "next/navigation";
import { AdminMonthPicker } from "@/components/admin/ui/AdminMonthPicker";

export function ReportMonthPicker({ month }: { month: string }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <AdminMonthPicker
      className="w-44"
      align="end"
      value={month}
      onChange={(next) => {
        router.push(`${pathname}?month=${next}`);
      }}
    />
  );
}
