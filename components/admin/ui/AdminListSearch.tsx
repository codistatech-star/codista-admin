"use client";

import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminListSearch({
  placeholder = "Search…",
  className,
  sticky,
  /** @deprecated Fill freeze removed; kept for call-site compatibility. */
  fill: _fill,
  children,
}: {
  placeholder?: string;
  className?: string;
  sticky?: boolean;
  fill?: boolean;
  children: (query: string) => ReactNode;
}) {
  void _fill;
  const [query, setQuery] = useState("");
  const normalized = useMemo(() => query.trim().toLowerCase(), [query]);

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          sticky &&
            "sticky top-0 z-20 -mx-1 bg-[var(--admin-surface)] px-1 py-2 md:static md:mx-0 md:bg-transparent md:p-0",
        )}
      >
        <input
          className="admin-input w-full md:max-w-md"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
        />
      </div>
      {children(normalized)}
    </div>
  );
}

export function matchesSearch(query: string, ...parts: Array<string | number | null | undefined>) {
  if (!query) return true;
  const haystack = parts
    .filter((p) => p != null && p !== "")
    .map((p) => String(p).toLowerCase())
    .join(" ");
  return haystack.includes(query);
}
