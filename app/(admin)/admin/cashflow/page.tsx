import { startOfDay } from "date-fns";
import {
  PageHeader,
  AdminCard,
  SubmitButton,
  AdminTableWrap,
  AdminSelect,
  AdminDatePicker,
  AdminEmptyRow,
  AdminModal,
} from "@/components/admin/ui";
import { getActiveBranchId, requireSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { formatDate, formatINR } from "@/lib/utils";
import { addCashEntry } from "../cms-actions";

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
    <div className="space-y-6">
      <PageHeader
        title="Cashflow"
        description="Today's income and expenses"
        actions={
          <AdminModal title="Add cash entry" trigger="Add entry">
            <form action={addCashEntry} className="space-y-3">
              <label className="admin-label">
                Type
                <AdminSelect
                  className="mt-1"
                  name="type"
                  required
                  defaultValue="EXPENSE"
                  options={[
                    { value: "EXPENSE", label: "Expense" },
                    { value: "INCOME", label: "Income" },
                  ]}
                />
              </label>
              <label className="admin-label">
                Account
                <AdminSelect className="mt-1" name="accountId" required options={accountOptions} />
              </label>
              <label className="admin-label">
                Amount
                <input className="admin-input mt-1" name="amount" type="number" placeholder="Amount" required />
              </label>
              <label className="admin-label">
                Category
                <input className="admin-input mt-1" name="category" placeholder="Category (rent, salary…)" />
              </label>
              <label className="admin-label">
                Description
                <input className="admin-input mt-1" name="description" placeholder="Description" />
              </label>
              <label className="admin-label">
                Date
                <AdminDatePicker className="mt-1" name="entryDate" defaultValue={todayStr} />
              </label>
              <SubmitButton className="w-full">Save entry</SubmitButton>
            </form>
          </AdminModal>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
            Today income
          </p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">{formatINR(todayIn)}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
            Today expense
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--admin-red)]">{formatINR(todayOut)}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
            Today net
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--admin-navy)]">
            {formatINR(todayIn - todayOut)}
          </p>
        </AdminCard>
      </div>

      <AdminTableWrap>
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
      </AdminTableWrap>
    </div>
  );
}
