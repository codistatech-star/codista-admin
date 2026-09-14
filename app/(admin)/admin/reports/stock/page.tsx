import { PageHeader, AdminCard, AdminTableWrap, AdminEmptyRow } from "@/components/admin/ui";
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

      <AdminTableWrap>
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
      </AdminTableWrap>
    </div>
  );
}
