"use client";

import { useMemo, useState, type ReactNode } from "react";

export function AdminListSearch({
  placeholder = "Search…",
  className,
  children,
}: {
  placeholder?: string;
  className?: string;
  children: (query: string) => ReactNode;
}) {
  const [query, setQuery] = useState("");
  const normalized = useMemo(() => query.trim().toLowerCase(), [query]);

  return (
    <div className={className ?? "space-y-4"}>
      <input
        className="admin-input w-full md:max-w-md"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
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
