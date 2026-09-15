"use client";

import {
  AdminCard,
  AdminEmptyRow,
  AdminResponsiveList,
  AdminListCard,
  AdminListSearch,
  matchesSearch,
} from "@/components/admin/ui";
import { formatDate, formatINR } from "@/lib/utils";

export type CashflowLedgerRow = {
  id: string;
  entryDate: string;
  accountName: string;
  type: string;
  category: string | null;
  description: string | null;
  amount: number;
};

export function CashflowReportLedger({
  entries,
  fill,
}: {
  entries: CashflowLedgerRow[];
  fill?: boolean;
}) {
  return (
    <AdminCard
      title="Ledger"
      className={fill ? "flex min-h-0 flex-1 flex-col overflow-hidden" : undefined}
    >
      <AdminListSearch fill={fill} placeholder="Search date, account, type, category…">
        {(q) => {
          const filtered = entries.filter((e) =>
            matchesSearch(
              q,
              formatDate(e.entryDate),
              e.accountName,
              e.type,
              e.category,
              e.description,
              e.amount,
            ),
          );

          return (
            <AdminResponsiveList
              fill={fill}
              cards={
                filtered.length ? (
                  filtered.map((e) => (
                    <AdminListCard key={e.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm text-[var(--admin-muted)]">{formatDate(e.entryDate)}</p>
                          <p className="font-medium text-gray-900">{e.accountName}</p>
                          <p className="mt-0.5 text-xs text-[var(--admin-muted)]">{e.type}</p>
                        </div>
                        <p className="shrink-0 font-semibold text-[var(--admin-navy)]">
                          {formatINR(e.amount)}
                        </p>
                      </div>
                      <div className="mt-3 text-sm">
                        <p className="text-xs text-[var(--admin-muted)]">Category</p>
                        <p>{e.category || "—"}</p>
                        {e.description ? (
                          <p className="mt-1 text-xs text-[var(--admin-muted)]">{e.description}</p>
                        ) : null}
                      </div>
                    </AdminListCard>
                  ))
                ) : (
                  <AdminListCard>
                    <p className="text-center text-sm text-[var(--admin-muted)]">
                      {q ? "No matching entries." : "No entries this month."}
                    </p>
                  </AdminListCard>
                )
              }
              table={
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Account</th>
                      <th>Type</th>
                      <th>Category</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((e) => (
                      <tr key={e.id}>
                        <td>{formatDate(e.entryDate)}</td>
                        <td>{e.accountName}</td>
                        <td>{e.type}</td>
                        <td>
                          {e.category || "—"}
                          {e.description ? (
                            <span className="block text-xs text-[var(--admin-muted)]">
                              {e.description}
                            </span>
                          ) : null}
                        </td>
                        <td>{formatINR(e.amount)}</td>
                      </tr>
                    ))}
                    {!filtered.length ? (
                      <AdminEmptyRow
                        colSpan={5}
                        message={q ? "No matching entries." : "No entries this month."}
                      />
                    ) : null}
                  </tbody>
                </table>
              }
            />
          );
        }}
      </AdminListSearch>
    </AdminCard>
  );
}
