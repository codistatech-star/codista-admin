import { startOfDay } from "date-fns";
import {
  PageHeader,
  AdminCard,
  AdminFillPage,
  AdminEmptyRow,
  AdminResponsiveList,
  AdminListCard,
} from "@/components/admin/ui";
import { AddCashEntryModal } from "@/components/admin/AddCashEntryModal";
import { getActiveBranchId, requireSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { formatDate, formatINR } from "@/lib/utils";

export default async function CashflowPage() {
  const user = await requireSession();
  const branchId = await getActiveBranchId(user);
  if (!branchId) {
    return (
      <div>
        <PageHeader title="Cashflow" />
        <p className="text-sm text-[var(--admin-muted)]">No branch</p>
      </div>
    );
  }

  const today = startOfDay(new Date());
  const todayStr = new Date().toISOString().slice(0, 10);

  const [accounts, entries, todayEntries] = await Promise.all([
    prisma.cashAccount.findMany({
      where: { branchId, isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.cashEntry.findMany({
      where: { branchId },
      include: { account: true },
      orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
    prisma.cashEntry.findMany({
      where: { branchId, entryDate: today },
      select: { type: true, amount: true },
    }),
  ]);

  const todayIn = todayEntries
    .filter((e) => e.type === "INCOME")
    .reduce((n, e) => n + Number(e.amount), 0);
  const todayOut = todayEntries
    .filter((e) => e.type === "EXPENSE")
    .reduce((n, e) => n + Number(e.amount), 0);

  const accountOptions = accounts.map((a) => ({ value: a.id, label: a.name }));

  return (
    <AdminFillPage>
      <div className="shrink-0 space-y-3 pb-4 md:space-y-4">
        <PageHeader
          className="!mb-0"
          title="Cashflow"
          description="Today's income and expenses"
          actions={
            <AddCashEntryModal accountOptions={accountOptions} defaultDate={todayStr} />
          }
        />

        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <AdminCard className="p-3 md:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--admin-muted)] md:text-xs">
              Today income
            </p>
            <p className="mt-1 text-lg font-semibold text-emerald-600 md:mt-2 md:text-2xl">
              {formatINR(todayIn)}
            </p>
          </AdminCard>
          <AdminCard className="p-3 md:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--admin-muted)] md:text-xs">
              Today expense
            </p>
            <p className="mt-1 text-lg font-semibold text-[var(--admin-red)] md:mt-2 md:text-2xl">
              {formatINR(todayOut)}
            </p>
          </AdminCard>
          <AdminCard className="p-3 md:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--admin-muted)] md:text-xs">
              Today net
            </p>
            <p className="mt-1 text-lg font-semibold text-[var(--admin-navy)] md:mt-2 md:text-2xl">
              {formatINR(todayIn - todayOut)}
            </p>
          </AdminCard>
        </div>
      </div>

      <div className="min-h-0 flex-1">
      <AdminResponsiveList
        fill
        cards={
          entries.length ? (
            entries.map((e) => (
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
              <p className="text-center text-sm text-[var(--admin-muted)]">No cashflow entries yet.</p>
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
              {entries.map((e) => (
                <tr key={e.id}>
                  <td>{formatDate(e.entryDate)}</td>
                  <td>{e.account.name}</td>
                  <td>{e.type}</td>
                  <td>
                    {e.category}
                    {e.description ? (
                      <span className="block text-xs text-[var(--admin-muted)]">{e.description}</span>
                    ) : null}
                  </td>
                  <td>{formatINR(Number(e.amount))}</td>
                </tr>
              ))}
              {!entries.length ? (
                <AdminEmptyRow colSpan={5} message="No cashflow entries yet." />
              ) : null}
            </tbody>
          </table>
        }
      />
      </div>
    </AdminFillPage>
  );
}
