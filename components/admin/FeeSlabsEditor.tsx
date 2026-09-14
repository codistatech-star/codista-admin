"use client";

import { useMemo, useState } from "react";

function SecondaryButton({
  children,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button type={type} className="btn-secondary" onClick={onClick}>
      {children}
    </button>
  );
}

export type FeeSlabRow = { fromDay: number; toDay: number; percent: number };

const DEFAULT_SLABS: FeeSlabRow[] = [
  { fromDay: 1, toDay: 10, percent: 100 },
  { fromDay: 11, toDay: 15, percent: 50 },
];

export function FeeSlabsEditor({
  name = "joiningFeeSlabs",
  initialSlabs,
}: {
  name?: string;
  initialSlabs?: FeeSlabRow[] | null;
}) {
  const [slabs, setSlabs] = useState<FeeSlabRow[]>(() => {
    if (initialSlabs && Array.isArray(initialSlabs) && initialSlabs.length) {
      return initialSlabs.map((s) => ({
        fromDay: Number(s.fromDay) || 1,
        toDay: Number(s.toDay) || 1,
        percent: Number(s.percent) || 0,
      }));
    }
    return DEFAULT_SLABS;
  });

  const json = useMemo(() => JSON.stringify(slabs), [slabs]);

  function update(index: number, patch: Partial<FeeSlabRow>) {
    setSlabs((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function remove(index: number) {
    setSlabs((rows) => rows.filter((_, i) => i !== index));
  }

  function add() {
    setSlabs((rows) => {
      const last = rows[rows.length - 1];
      const fromDay = last ? Math.min(31, last.toDay + 1) : 1;
      return [...rows, { fromDay, toDay: Math.min(31, fromDay + 4), percent: 50 }];
    });
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={json} />
      <div className="overflow-x-auto rounded-lg border border-[var(--admin-border)]">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-[var(--admin-muted)]">
            <tr>
              <th className="px-3 py-2 font-semibold">From day</th>
              <th className="px-3 py-2 font-semibold">To day</th>
              <th className="px-3 py-2 font-semibold">Charge %</th>
              <th className="px-3 py-2 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {slabs.map((slab, index) => (
              <tr key={index} className="border-t border-gray-100">
                <td className="px-3 py-2">
                  <input
                    className="admin-input"
                    type="number"
                    min={1}
                    max={31}
                    value={slab.fromDay}
                    onChange={(e) => update(index, { fromDay: Number(e.target.value) || 1 })}
                    aria-label={`Slab ${index + 1} from day`}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className="admin-input"
                    type="number"
                    min={1}
                    max={31}
                    value={slab.toDay}
                    onChange={(e) => update(index, { toDay: Number(e.target.value) || 1 })}
                    aria-label={`Slab ${index + 1} to day`}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className="admin-input"
                    type="number"
                    min={0}
                    max={100}
                    value={slab.percent}
                    onChange={(e) => update(index, { percent: Number(e.target.value) || 0 })}
                    aria-label={`Slab ${index + 1} charge percent`}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    className="text-xs font-semibold text-[var(--admin-red)] hover:underline disabled:opacity-40"
                    onClick={() => remove(index)}
                    disabled={slabs.length <= 1}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SecondaryButton type="button" onClick={add}>
        Add slab
      </SecondaryButton>
      <p className="text-xs text-[var(--admin-muted)]">
        Charge % of the class plan fee by day of month on first payment (e.g. days 1–10 → 100%, 11–15 →
        50%). Joining fee is charged in full and is not affected by these slabs.
      </p>
    </div>
  );
}
