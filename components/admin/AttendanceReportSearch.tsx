"use client";

import { useEffect, useState } from "react";
import { SubmitButton } from "@/components/admin/ui";

export function AttendanceReportSearch({
  placeholder,
  value,
  onSearch,
}: {
  placeholder: string;
  value: string;
  onSearch: (q: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <form
      className="flex flex-wrap gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(draft);
      }}
    >
      <input
        className="admin-input w-full md:max-w-xs"
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      <SubmitButton pendingLabel="Searching…">Search</SubmitButton>
      {value ? (
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setDraft("");
            onSearch("");
          }}
        >
          Clear
        </button>
      ) : null}
    </form>
  );
}
