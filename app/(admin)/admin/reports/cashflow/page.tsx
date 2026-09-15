import Link from "next/link";
import { subMonths } from "date-fns";
import {
  PageHeader,
  AdminCard,
  AdminFillPage,
  AdminResponsiveList,
  AdminListCard,
} from "@/components/admin/ui";
import { CashflowReportLedger } from "@/components/admin/CashflowReportLedger";
import { ReportMonthPicker } from "@/components/admin/ReportMonthPicker";
import { getActiveBranchId, requireSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { buildCashflowReport } from "@/lib/report-cashflow";
import { parseReportMonth, reportMonthLabel } from "@/lib/report-month";
import { formatINR } from "@/lib/utils";

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

  const ledgerRows = report.entries.map((e) => ({
    id: e.id,
    entryDate: e.entryDate.toISOString(),
    accountName: e.accountName,
    type: e.type,
    category: e.category,
    description: e.description,
    amount: e.amount,
  }));

  return (
    <AdminFillPage>
      <PageHeader
        className="!mb-3"
        title="Cashflow report"
        description={`Institute P&L — ${reportMonthLabel(start)}`}
        actions={<ReportMonthPicker month={month} />}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
            Balances
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[var(--admin-muted)]">Opening</dt>
              <dd className="text-lg font-semibold text-[var(--admin-navy)]">
                {formatINR(report.opening)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-[var(--admin-border)] pt-2">
              <dt className="text-[var(--admin-muted)]">Closing</dt>
              <dd className="text-lg font-semibold text-[var(--admin-navy)]">
                {formatINR(report.closing)}
              </dd>
            </div>
          </dl>
        </AdminCard>
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
            This month
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[var(--admin-muted)]">Income</dt>
              <dd className="font-semibold text-emerald-600">{formatINR(report.income)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[var(--admin-muted)]">Expense</dt>
              <dd className="font-semibold text-[var(--admin-red)]">{formatINR(report.expense)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-[var(--admin-border)] pt-2">
              <dt className="font-medium text-gray-900">Net</dt>
              <dd className="text-right">
                <p className="text-lg font-semibold text-[var(--admin-navy)]">{formatINR(report.net)}</p>
                <p className="text-xs text-[var(--admin-muted)]">{vsLast}</p>
              </dd>
            </div>
          </dl>
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

      <CashflowReportLedger entries={ledgerRows} />
    </AdminFillPage>
  );
}
