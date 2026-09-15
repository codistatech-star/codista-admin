"use client";

import { useRouter, usePathname } from "next/navigation";
import { AdminSelect } from "@/components/admin/ui/AdminSelect";

export function ReportBatchFilter({
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

  return (
    <AdminSelect
      className="w-full sm:w-48"
      value={batch}
      options={options}
      onChange={(next) => {
        const params = new URLSearchParams();
        params.set("month", month);
        if (next) params.set("batch", next);
        router.push(`${pathname}?${params.toString()}`);
      }}
    />
  );
}
