"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

function AttendanceReportPagerInner({
  page,
  pageSize,
  total,
}: {
  page: number;
  pageSize: number;
  total: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  function hrefFor(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) params.delete("page");
    else params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  if (total <= pageSize) {
    return total > 0 ? (
      <p className="text-sm text-[var(--admin-muted)]">
        Showing {from}–{to} of {total}
      </p>
    ) : null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--admin-border)] pt-4">
      <p className="text-sm text-[var(--admin-muted)]">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        {safePage > 1 ? (
          <Link href={hrefFor(safePage - 1)} className="btn-secondary">
            Previous
          </Link>
        ) : (
          <span className="btn-secondary pointer-events-none opacity-40">Previous</span>
        )}
        <span className="text-sm text-[var(--admin-muted)]">
          Page {safePage} of {totalPages}
        </span>
        {safePage < totalPages ? (
          <Link href={hrefFor(safePage + 1)} className="btn-secondary">
            Next
          </Link>
        ) : (
          <span className="btn-secondary pointer-events-none opacity-40">Next</span>
        )}
      </div>
    </div>
  );
}

export function AttendanceReportPager({
  page,
  pageSize,
  total,
}: {
  page: number;
  pageSize: number;
  total: number;
}) {
  return (
    <Suspense fallback={null}>
      <AttendanceReportPagerInner page={page} pageSize={pageSize} total={total} />
    </Suspense>
  );
}
