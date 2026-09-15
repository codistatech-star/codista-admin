import Link from "next/link";
import { addMonths, format, startOfMonth } from "date-fns";
import {
  PageHeader,
  AdminCard,
  AdminFillPage,
  SubmitButton,
  AdminEmptyRow,
  AdminSelect,
  AdminResponsiveList,
  AdminListCard,
} from "@/components/admin/ui";
import { AddStockItemModal } from "@/components/admin/AddStockItemModal";
import { RecordStockMovementModal } from "@/components/admin/RecordStockMovementModal";
import { StockRowActions } from "@/components/admin/StockRowActions";
import { StockVariantsModal } from "@/components/admin/StockVariantsModal";
import type { StockItemDTO } from "@/components/admin/stock-types";
import { getActiveBranchId, requireSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getStockSalesReport } from "@/lib/report-stock";
import { formatINR } from "@/lib/utils";

function toItemDTO(item: {
  id: string;
  name: string;
  sku: string | null;
  salePrice: { toString(): string } | number;
  costPrice: { toString(): string } | number;
  lowStockAt: number;
  variants: {
    id: string;
    label: string;
    quantity: number;
    salePrice: { toString(): string } | number | null;
    costPrice: { toString(): string } | number | null;
  }[];
}): StockItemDTO {
  return {
    id: item.id,
    name: item.name,
    sku: item.sku,
    salePrice: Number(item.salePrice),
    costPrice: Number(item.costPrice),
    lowStockAt: item.lowStockAt,
    variants: item.variants.map((v) => ({
      id: v.id,
      label: v.label,
      quantity: v.quantity,
      salePrice: v.salePrice == null ? null : Number(v.salePrice),
      costPrice: v.costPrice == null ? null : Number(v.costPrice),
    })),
  };
}

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stock?: string }>;
}) {
  await requireSession();
  const sp = await searchParams;
  const branchId = await getActiveBranchId();
  const q = (sp.q ?? "").trim();
  const lowOnly = sp.stock === "low";
  const monthStart = startOfMonth(new Date());
  const monthEnd = addMonths(monthStart, 1);
  const monthKey = format(monthStart, "yyyy-MM");
  const stockReportHref = `/admin/reports/stock?month=${monthKey}`;

  const [allItems, members, monthSales] = await Promise.all([
    prisma.stockItem.findMany({
      where: { isActive: true },
      include: { variants: { orderBy: { label: "asc" } } },
      orderBy: { name: "asc" },
    }),
    branchId
      ? prisma.member.findMany({
          where: { branchId, isActive: true },
          orderBy: { name: "asc" },
          take: 200,
          select: { id: true, code: true, name: true },
        })
      : Promise.resolve([]),
    branchId
      ? getStockSalesReport({ branchId, start: monthStart, end: monthEnd })
      : Promise.resolve({ unitsSold: 0, revenue: 0, cost: 0, profit: 0, lines: [] }),
  ]);

  const unitsOnHand = allItems.reduce(
    (n, item) => n + item.variants.reduce((qSum, v) => qSum + v.quantity, 0),
    0,
  );
  const lowCount = allItems.filter((item) => {
    const qty = item.variants.reduce((n, v) => n + v.quantity, 0);
    return qty <= item.lowStockAt;
  }).length;

  const stockableItems = allItems.map(toItemDTO);
  const canRecord = stockableItems.some((i) => i.variants.length > 0);

  let items = stockableItems;
  if (q) {
    const lower = q.toLowerCase();
    items = items.filter(
      (i) =>
        i.name.toLowerCase().includes(lower) ||
        (i.sku ? i.sku.toLowerCase().includes(lower) : false),
    );
  }
  if (lowOnly) {
    items = items.filter((item) => {
      const qty = item.variants.reduce((n, v) => n + v.quantity, 0);
      return qty <= item.lowStockAt;
    });
  }

  const emptyMessage =
    q || lowOnly
      ? "No stock items match these filters."
      : "No stock items yet. Use Add item to create the catalogue.";

  const cards = [
    { label: "Items", value: String(allItems.length), href: "/admin/stock" },
    { label: "Units on hand", value: String(unitsOnHand), href: "/admin/stock" },
    {
      label: "Low stock",
      value: String(lowCount),
      href: "/admin/stock?stock=low",
    },
    {
      label: "Stock sales this month",
      value: formatINR(monthSales.revenue),
      href: stockReportHref,
    },
    {
      label: "Stock profit this month",
      value: formatINR(monthSales.profit),
      href: stockReportHref,
      valueClassName:
        monthSales.profit >= 0 ? "text-emerald-600" : "text-[var(--admin-red)]",
    },
  ];

  return (
    <AdminFillPage>
      <div className="shrink-0 space-y-3 pb-4 md:space-y-4">
        <PageHeader
          className="!mb-0"
          title="Stock"
          description="Catalogue, sizes, purchases and sales"
          actions={
            <>
              <AddStockItemModal />
              <RecordStockMovementModal
                items={stockableItems}
                members={members}
                disabled={!canRecord}
                triggerClassName="btn-secondary hover:!border-[var(--admin-red)] hover:!bg-[var(--admin-red)] hover:!text-white"
              />
            </>
          }
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5 md:gap-4">
          {cards.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="admin-card p-3 transition hover:border-[var(--admin-navy)] md:p-5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--admin-muted)] md:text-xs">
                {c.label}
              </p>
              <p
                className={`mt-2 text-xl font-semibold md:mt-3 md:text-3xl ${
                  "valueClassName" in c && c.valueClassName
                    ? c.valueClassName
                    : "text-[var(--admin-navy)]"
                }`}
              >
                {c.value}
              </p>
            </Link>
          ))}
        </div>

        <AdminCard>
          <form className="flex flex-wrap gap-3">
            <input
              className="admin-input w-full md:max-w-xs"
              name="q"
              placeholder="Search name / SKU"
              defaultValue={sp.q}
            />
            <AdminSelect
              className="w-full md:max-w-xs"
              name="stock"
              defaultValue={sp.stock ?? ""}
              placeholder="All stock"
              options={[{ value: "low", label: "Low stock only" }]}
            />
            <SubmitButton pendingLabel="Filtering…">Filter</SubmitButton>
            {q || lowOnly ? (
              <Link href="/admin/stock" className="btn-secondary">
                Clear
              </Link>
            ) : null}
          </form>
        </AdminCard>
      </div>

      <div className="min-h-0 flex-1">
      <AdminResponsiveList
        fill
        cards={
          items.length ? (
            items.map((item) => {
              const qty = item.variants.reduce((n, v) => n + v.quantity, 0);
              const low = qty <= item.lowStockAt;
              return (
                <AdminListCard key={item.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="mt-0.5 font-mono text-xs text-[var(--admin-muted)]">
                        {item.sku ?? "—"}
                      </p>
                    </div>
                    {low ? (
                      <span className="badge-expired">Low stock</span>
                    ) : (
                      <span className="badge-active">OK</span>
                    )}
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-xs text-[var(--admin-muted)]">Variants / qty</dt>
                      <dd>
                        <StockVariantsModal
                          item={item}
                          trigger={`${item.variants.length} / ${qty}`}
                        />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[var(--admin-muted)]">Sale price</dt>
                      <dd>{formatINR(item.salePrice)}</dd>
                    </div>
                  </dl>
                  <div className="mt-3 flex justify-end border-t border-[var(--admin-border)] pt-3">
                    <StockRowActions item={item} />
                  </div>
                </AdminListCard>
              );
            })
          ) : (
            <AdminListCard>
              <p className="text-center text-sm text-[var(--admin-muted)]">{emptyMessage}</p>
            </AdminListCard>
          )
        }
        table={
          <table className="admin-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>SKU</th>
                <th>Variants / qty</th>
                <th>Sale price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const qty = item.variants.reduce((n, v) => n + v.quantity, 0);
                const low = qty <= item.lowStockAt;
                return (
                  <tr key={item.id}>
                    <td className="font-medium text-gray-900">{item.name}</td>
                    <td className="font-mono text-xs">{item.sku ?? "—"}</td>
                    <td>
                      <StockVariantsModal
                        item={item}
                        trigger={`${item.variants.length} / ${qty}`}
                      />
                    </td>
                    <td>{formatINR(item.salePrice)}</td>
                    <td>
                      {low ? (
                        <span className="badge-expired">Low stock</span>
                      ) : (
                        <span className="badge-active">OK</span>
                      )}
                    </td>
                    <td>
                      <StockRowActions item={item} />
                    </td>
                  </tr>
                );
              })}
              {!items.length ? <AdminEmptyRow colSpan={6} message={emptyMessage} /> : null}
            </tbody>
          </table>
        }
      />
      </div>
    </AdminFillPage>
  );
}
