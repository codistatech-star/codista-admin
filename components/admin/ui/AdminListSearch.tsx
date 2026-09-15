"use client";

import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminListSearch({
  placeholder = "Search…",
  className,
  fill,
  children,
}: {
  placeholder?: string;
  className?: string;
  fill?: boolean;
  children: (query: string) => ReactNode;
}) {
  const [query, setQuery] = useState("");
  const normalized = useMemo(() => query.trim().toLowerCase(), [query]);

  return (
    <div
      className={cn(
        fill ? "flex h-full min-h-0 flex-1 flex-col gap-4" : "space-y-4",
        className,
      )}
    >
      <input
        className="admin-input w-full shrink-0 md:max-w-md"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      <div className={fill ? "min-h-0 flex-1" : undefined}>{children(normalized)}</div>
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
