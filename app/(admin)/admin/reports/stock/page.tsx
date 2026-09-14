import {
  PageHeader,
  AdminCard,
  AdminEmptyRow,
  AdminResponsiveList,
  AdminListCard,
} from "@/components/admin/ui";
import { requireSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export default async function StockReportPage() {
  await requireSession();
  const stock = await prisma.stockItem.findMany({
    include: { variants: true },
    orderBy: { name: "asc" },
  });
  const rows = stock.map((item) => {
    const qty = item.variants.reduce((n, v) => n + v.quantity, 0);
    return { ...item, qty, low: qty <= item.lowStockAt };
  });
  const low = rows.filter((i) => i.low);

  return (
    <div className="space-y-6">
      <PageHeader title="Stock report" description="On-hand quantity and low-stock items" />

      <div className="grid gap-4 md:grid-cols-2">
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">Items</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--admin-navy)]">{rows.length}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">Low stock</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--admin-red)]">{low.length}</p>
        </AdminCard>
      </div>

      <AdminResponsiveList
        cards={
          rows.length ? (
            rows.map((i) => (
              <AdminListCard key={i.id}>
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-gray-900">{i.name}</p>
                  {i.low ? (
                    <span className="text-[var(--admin-red)]">Low</span>
                  ) : (
                    <span className="text-sm text-[var(--admin-muted)]">OK</span>
                  )}
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-xs text-[var(--admin-muted)]">On hand</dt>
                    <dd>{i.qty}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[var(--admin-muted)]">Low at</dt>
                    <dd>{i.lowStockAt}</dd>
                  </div>
                </dl>
              </AdminListCard>
            ))
          ) : (
            <AdminListCard>
              <p className="text-center text-sm text-[var(--admin-muted)]">No stock items.</p>
            </AdminListCard>
          )
        }
        table={
          <table className="admin-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>On hand</th>
                <th>Low at</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.id}>
                  <td className="font-medium text-gray-900">{i.name}</td>
                  <td>{i.qty}</td>
                  <td>{i.lowStockAt}</td>
                  <td>{i.low ? <span className="text-[var(--admin-red)]">Low</span> : "OK"}</td>
                </tr>
              ))}
              {!rows.length ? <AdminEmptyRow colSpan={4} message="No stock items." /> : null}
            </tbody>
          </table>
        }
      />
    </div>
  );
}
