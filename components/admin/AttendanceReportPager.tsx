"use client";

export function AttendanceReportPager({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

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
          <button type="button" className="btn-secondary" onClick={() => onPageChange(safePage - 1)}>
            Previous
          </button>
        ) : (
          <span className="btn-secondary pointer-events-none opacity-40">Previous</span>
        )}
        <span className="text-sm text-[var(--admin-muted)]">
          Page {safePage} of {totalPages}
        </span>
        {safePage < totalPages ? (
          <button type="button" className="btn-secondary" onClick={() => onPageChange(safePage + 1)}>
            Next
          </button>
        ) : (
          <span className="btn-secondary pointer-events-none opacity-40">Next</span>
        )}
      </div>
    </div>
  );
}
