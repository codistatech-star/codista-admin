"use client";

import { Suspense, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SubmitButton } from "@/components/admin/ui";

function AttendanceReportSearchInner({
  placeholder,
  defaultValue,
}: {
  placeholder: string;
  defaultValue: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);

  function apply(nextQ: string) {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = nextQ.trim();
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <form
      className="flex flex-wrap gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        apply(value);
      }}
    >
      <input
        className="admin-input w-full md:max-w-xs"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      <SubmitButton pendingLabel="Searching…">Search</SubmitButton>
      {defaultValue ? (
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setValue("");
            apply("");
          }}
        >
          Clear
        </button>
      ) : null}
    </form>
  );
}

export function AttendanceReportSearch({
  placeholder,
  defaultValue = "",
}: {
  placeholder: string;
  defaultValue?: string;
}) {
  return (
    <Suspense
      fallback={<div className="h-10 w-full max-w-xs animate-pulse rounded-lg border border-[var(--admin-border)] bg-gray-50" />}
    >
      <AttendanceReportSearchInner placeholder={placeholder} defaultValue={defaultValue} />
    </Suspense>
  );
}
