import Link from "next/link";
import { subMonths } from "date-fns";
import {
  PageHeader,
  AdminCard,
  AdminEmptyRow,
  AdminResponsiveList,
  AdminListCard,
} from "@/components/admin/ui";
import { ReportMonthPicker } from "@/components/admin/ReportMonthPicker";
import { getActiveBranchId, requireSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { buildCashflowReport, sourceLabel } from "@/lib/report-cashflow";
import { parseReportMonth, reportMonthLabel } from "@/lib/report-month";
import { formatDate, formatINR } from "@/lib/utils";

export default async function CashflowReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireSession();
  const branchId = await getActiveBranchId(user);
  if (!branchId) {
    return (
      <div>
        <PageHeader title="Cashflow report" />
        <p className="text-sm text-[var(--admin-muted)]">No branch</p>
      </div>
    );
  }

  const sp = await searchParams;
  const { month, start, end } = parseReportMonth(sp.month);
  const prevStart = subMonths(start, 1);

  const [accounts, allEntries] = await Promise.all([
    prisma.cashAccount.findMany({
      where: { branchId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.cashEntry.findMany({
      where: { branchId, entryDate: { lt: end } },
      include: { account: { select: { name: true } } },
      orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  const report = buildCashflowReport({
    month,
    accounts,
    entries: allEntries,
    monthStart: start,
    monthEnd: end,
    prevStart,
  });

  const vsLast =
    report.netDelta == null
      ? "No prior month"
      : `${report.netDelta >= 0 ? "+" : ""}${formatINR(report.netDelta)}${
          report.netDeltaPct != null ? ` (${report.netDeltaPct >= 0 ? "+" : ""}${report.netDeltaPct}%)` : ""
        } vs last month`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cashflow report"
        description={`Institute P&L — ${reportMonthLabel(start)}`}
        actions={<ReportMonthPicker month={month} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
            Opening
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--admin-navy)]">
            {formatINR(report.opening)}
          </p>
        </AdminCard>
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
            Income
          </p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">{formatINR(report.income)}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
            Expense
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--admin-red)]">
            {formatINR(report.expense)}
          </p>
        </AdminCard>
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">Net</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--admin-navy)]">{formatINR(report.net)}</p>
          <p className="mt-1 text-xs text-[var(--admin-muted)]">{vsLast}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
            Closing
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--admin-navy)]">
            {formatINR(report.closing)}
          </p>
        </AdminCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AdminCard title="Income by source">
          {report.incomeBySource.length ? (
            <ul className="space-y-2 text-sm">
              {report.incomeBySource.map((row) => (
                <li key={row.source} className="flex items-center justify-between gap-3">
                  {row.href ? (
                    <Link href={row.href} className="text-[var(--admin-navy)] underline-offset-2 hover:underline">
                      {row.label}
                    </Link>
                  ) : (
                    <span>{row.label}</span>
                  )}
                  <span className="font-medium text-gray-900">{formatINR(row.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--admin-muted)]">No income this month.</p>
          )}
        </AdminCard>

        <AdminCard title="Expense by category">
          {report.expenseByCategory.length ? (
            <ul className="space-y-2 text-sm">
              {report.expenseByCategory.map((row) => (
                <li key={row.category} className="flex items-center justify-between gap-3">
                  <span>{row.category}</span>
                  <span className="font-medium text-gray-900">{formatINR(row.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--admin-muted)]">No expenses this month.</p>
          )}
        </AdminCard>
      </div>

      <AdminCard title="Account movement">
        <AdminResponsiveList
          cards={
            report.accounts.map((a) => (
              <AdminListCard key={a.id}>
                <p className="font-medium text-gray-900">{a.name}</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-xs text-[var(--admin-muted)]">Opening</dt>
                    <dd>{formatINR(a.opening)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--admin-muted)]">In</dt>
                    <dd className="text-emerald-600">{formatINR(a.income)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--admin-muted)]">Out</dt>
                    <dd className="text-[var(--admin-red)]">{formatINR(a.expense)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--admin-muted)]">Closing</dt>
                    <dd className="font-semibold">{formatINR(a.closing)}</dd>
                  </div>
                </dl>
              </AdminListCard>
            ))
          }
          table={
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Opening</th>
                  <th>In</th>
                  <th>Out</th>
                  <th>Closing</th>
                </tr>
              </thead>
              <tbody>
                {report.accounts.map((a) => (
                  <tr key={a.id}>
                    <td className="font-medium text-gray-900">{a.name}</td>
                    <td>{formatINR(a.opening)}</td>
                    <td className="text-emerald-600">{formatINR(a.income)}</td>
                    <td className="text-[var(--admin-red)]">{formatINR(a.expense)}</td>
                    <td className="font-semibold">{formatINR(a.closing)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        />
      </AdminCard>

      <AdminCard title="Ledger" description="All cash entries this month">
        <AdminResponsiveList
          cards={
            report.entries.length ? (
              report.entries.map((e) => (
                <AdminListCard key={e.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-[var(--admin-muted)]">{formatDate(e.entryDate)}</p>
                      <p className="font-medium text-gray-900">{e.accountName}</p>
                      <p className="mt-0.5 text-xs text-[var(--admin-muted)]">
                        {sourceLabel(e.source)} · {e.type}
                      </p>
                    </div>
                    <p
                      className={
                        e.type === "INCOME"
                          ? "shrink-0 font-semibold text-emerald-600"
                          : "shrink-0 font-semibold text-[var(--admin-red)]"
                      }
                    >
                      {e.type === "INCOME" ? "+" : "−"}
                      {formatINR(e.amount)}
                    </p>
                  </div>
                  <p className="mt-3 text-sm">{e.category || "—"}</p>
                  {e.description ? (
                    <p className="mt-1 text-xs text-[var(--admin-muted)]">{e.description}</p>
                  ) : null}
                </AdminListCard>
              ))
            ) : (
              <AdminListCard>
                <p className="text-center text-sm text-[var(--admin-muted)]">
                  No cashflow entries this month.
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
                  <th>Source</th>
                  <th>Category</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {report.entries.map((e) => (
                  <tr key={e.id}>
                    <td>{formatDate(e.entryDate)}</td>
                    <td>{e.accountName}</td>
                    <td>{sourceLabel(e.source)}</td>
                    <td>
                      {e.category || "—"}
                      {e.description ? (
                        <span className="block text-xs text-[var(--admin-muted)]">{e.description}</span>
                      ) : null}
                    </td>
                    <td
                      className={
                        e.type === "INCOME" ? "text-emerald-600" : "text-[var(--admin-red)]"
                      }
                    >
                      {e.type === "INCOME" ? "+" : "−"}
                      {formatINR(e.amount)}
                    </td>
                  </tr>
                ))}
                {!report.entries.length ? (
                  <AdminEmptyRow colSpan={5} message="No cashflow entries this month." />
                ) : null}
              </tbody>
            </table>
          }
        />
      </AdminCard>
    </div>
  );
}
