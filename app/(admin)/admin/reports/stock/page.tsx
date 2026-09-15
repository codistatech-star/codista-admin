import {
  PageHeader,
  AdminCard,
  AdminFillPage,
  AdminEmptyRow,
  AdminResponsiveList,
  AdminListCard,
} from "@/components/admin/ui";
import { ReportMonthPicker } from "@/components/admin/ReportMonthPicker";
import { getActiveBranchId, requireSession } from "@/lib/auth-helpers";
import { parseReportMonth, reportMonthLabel } from "@/lib/report-month";
import { getStockSalesReport } from "@/lib/report-stock";
import { formatDate, formatINR } from "@/lib/utils";

export default async function StockReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireSession();
  const branchId = await getActiveBranchId(user);
  const sp = await searchParams;
  const { month, start, end } = parseReportMonth(sp.month);

  const salesReport = branchId
    ? await getStockSalesReport({ branchId, start, end })
    : {
        unitsSold: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        lines: [] as Awaited<ReturnType<typeof getStockSalesReport>>["lines"],
      };

  return (
    <AdminFillPage>
      <PageHeader
        className="!mb-3"
        title="Stock report"
        description={`Sales & profit — ${reportMonthLabel(start)}`}
        actions={<ReportMonthPicker month={month} />}
      />

      {!branchId ? (
        <p className="text-sm text-[var(--admin-muted)]">No branch selected — sales totals unavailable.</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
            Units sold
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--admin-navy)]">{salesReport.unitsSold}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
            Sales
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--admin-navy)]">
            {formatINR(salesReport.revenue)}
          </p>
        </AdminCard>
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
            Cost
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--admin-navy)]">
            {formatINR(salesReport.cost)}
          </p>
        </AdminCard>
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
            Profit
          </p>
          <p
            className={`mt-2 text-2xl font-semibold ${
              salesReport.profit >= 0 ? "text-emerald-600" : "text-[var(--admin-red)]"
            }`}
          >
            {formatINR(salesReport.profit)}
          </p>
        </AdminCard>
      </div>

      <AdminCard title="Stock sales this month">
        <AdminResponsiveList
          cards={
            salesReport.lines.length ? (
              salesReport.lines.map((line) => (
                <AdminListCard key={line.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{line.itemName}</p>
                      <p className="text-xs text-[var(--admin-muted)]">
                        {line.variantLabel ?? "—"}
                        {line.memberName
                          ? ` · ${line.memberName}${line.memberCode ? ` (${line.memberCode})` : ""}`
                          : ""}
                      </p>
                      <p className="mt-1 text-xs text-[var(--admin-muted)]">
                        {formatDate(line.createdAt)} · qty {line.quantity}
                      </p>
                    </div>
                    <div className="shrink-0 text-right text-sm">
                      <p className="font-semibold text-emerald-600">{formatINR(line.profit)}</p>
                      <p className="text-xs text-[var(--admin-muted)]">
                        {formatINR(line.revenue)} − {formatINR(line.cost)}
                      </p>
                    </div>
                  </div>
                </AdminListCard>
              ))
            ) : (
              <AdminListCard>
                <p className="text-center text-sm text-[var(--admin-muted)]">
                  No stock sales this month.
                </p>
              </AdminListCard>
            )
          }
          table={
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Variant</th>
                  <th>Member</th>
                  <th>Qty</th>
                  <th>Sale</th>
                  <th>Cost</th>
                  <th>Profit</th>
                </tr>
              </thead>
              <tbody>
                {salesReport.lines.map((line) => (
                  <tr key={line.id}>
                    <td>{formatDate(line.createdAt)}</td>
                    <td className="font-medium text-gray-900">{line.itemName}</td>
                    <td>{line.variantLabel ?? "—"}</td>
                    <td>
                      {line.memberName
                        ? `${line.memberName}${line.memberCode ? ` (${line.memberCode})` : ""}`
                        : "—"}
                    </td>
                    <td>{line.quantity}</td>
                    <td>{formatINR(line.revenue)}</td>
                    <td>{formatINR(line.cost)}</td>
                    <td
                      className={
                        line.profit >= 0 ? "text-emerald-600" : "text-[var(--admin-red)]"
                      }
                    >
                      {formatINR(line.profit)}
                    </td>
                  </tr>
                ))}
                {!salesReport.lines.length ? (
                  <AdminEmptyRow colSpan={8} message="No stock sales this month." />
                ) : null}
              </tbody>
            </table>
          }
        />
      </AdminCard>
    </AdminFillPage>
  );
}
