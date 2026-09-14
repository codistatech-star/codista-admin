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

  const [monthEntries, accounts, allForBalances] = await Promise.all([
    prisma.cashEntry.findMany({
      where: { branchId, entryDate: { gte: start, lt: end } },
      include: { account: true },
      orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
    }),
    prisma.cashAccount.findMany({
      where: { branchId, isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.cashEntry.findMany({
      where: { branchId },
      select: { accountId: true, type: true, amount: true },
    }),
  ]);

  const monthIn = monthEntries
    .filter((e) => e.type === "INCOME")
    .reduce((n, e) => n + Number(e.amount), 0);
  const monthOut = monthEntries
    .filter((e) => e.type === "EXPENSE")
    .reduce((n, e) => n + Number(e.amount), 0);

  const balances = accounts.map((a) => {
    const related = allForBalances.filter((e) => e.accountId === a.id);
    const bal = related.reduce(
      (n, e) => n + (e.type === "INCOME" ? Number(e.amount) : -Number(e.amount)),
      0,
    );
    return { ...a, balance: bal };
  });

  const preferred = ["Cash", "UPI", "Bank"];
  const orderedBalances = preferred.map((name) => {
    const found = balances.find((b) => b.name.toLowerCase() === name.toLowerCase());
    return found ?? { id: name, name, balance: 0 };
  });
  const extras = balances.filter(
    (b) => !preferred.some((n) => n.toLowerCase() === b.name.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cashflow report"
        description={`Income, expenses, and balances — ${reportMonthLabel(start)}`}
        actions={<ReportMonthPicker month={month} />}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <AdminCard title="This month">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
                Income
              </p>
              <p className="mt-2 text-xl font-semibold text-emerald-600">{formatINR(monthIn)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
                Expense
              </p>
              <p className="mt-2 text-xl font-semibold text-[var(--admin-red)]">{formatINR(monthOut)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
                Net
              </p>
              <p className="mt-2 text-xl font-semibold text-[var(--admin-navy)]">
                {formatINR(monthIn - monthOut)}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard title="Balances">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[...orderedBalances, ...extras].map((a) => (
              <div key={a.id}>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
                  {a.name}
                </p>
                <p className="mt-2 text-xl font-semibold text-[var(--admin-navy)]">
                  {formatINR(a.balance)}
                </p>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>

      <AdminResponsiveList
        cards={
          monthEntries.length ? (
            monthEntries.map((e) => (
              <AdminListCard key={e.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--admin-muted)]">{formatDate(e.entryDate)}</p>
                    <p className="font-medium text-gray-900">{e.account.name}</p>
                    <p className="mt-0.5 text-xs text-[var(--admin-muted)]">{e.type}</p>
                  </div>
                  <p className="shrink-0 font-semibold text-[var(--admin-navy)]">
                    {formatINR(Number(e.amount))}
                  </p>
                </div>
                <p className="mt-3 text-sm">{e.category || "—"}</p>
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
                <th>Type</th>
                <th>Category</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {monthEntries.map((e) => (
                <tr key={e.id}>
                  <td>{formatDate(e.entryDate)}</td>
                  <td>{e.account.name}</td>
                  <td>{e.type}</td>
                  <td>{e.category || "—"}</td>
                  <td>{formatINR(Number(e.amount))}</td>
                </tr>
              ))}
              {!monthEntries.length ? (
                <AdminEmptyRow colSpan={5} message="No cashflow entries this month." />
              ) : null}
            </tbody>
          </table>
        }
      />
    </div>
  );
}
