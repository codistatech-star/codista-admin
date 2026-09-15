import Link from "next/link";
import {
  PageHeader,
  AdminCard,
  AdminFillPage,
} from "@/components/admin/ui";
import { PaymentReportList } from "@/components/admin/PaymentReportList";
import { ReportMonthPicker } from "@/components/admin/ReportMonthPicker";
import { getActiveBranchId, requireSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { parseReportMonth, reportMonthLabel } from "@/lib/report-month";
import { getStockSalesReport } from "@/lib/report-stock";
import { formatINR } from "@/lib/utils";

export default async function PaymentReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireSession();
  const branchId = await getActiveBranchId(user);
  if (!branchId) {
    return (
      <div>
        <PageHeader title="Payment report" />
        <p className="text-sm text-[var(--admin-muted)]">No branch</p>
      </div>
    );
  }

  const sp = await searchParams;
  const { month, start, end } = parseReportMonth(sp.month);

  const [collections, stockSales] = await Promise.all([
    prisma.payment.findMany({
      where: { branchId, paidAt: { gte: start, lt: end } },
      include: { member: true },
      orderBy: { paidAt: "desc" },
    }),
    getStockSalesReport({ branchId, start, end }),
  ]);
  const total = collections.reduce((n, p) => n + Number(p.amountPaid), 0);
  const byMode = collections.reduce(
    (acc, p) => {
      acc[p.mode] = (acc[p.mode] ?? 0) + Number(p.amountPaid);
      return acc;
    },
    {} as Record<string, number>,
  );

  const rows = collections.map((p) => ({
    id: p.id,
    receiptNo: p.receiptNo,
    paidAt: p.paidAt.toISOString(),
    mode: p.mode,
    amountPaid: Number(p.amountPaid),
    memberName: p.member.name,
    memberCode: p.member.code,
    monthsCovered: p.monthsCovered,
    validUntil: p.validUntil.toISOString(),
    planFee: Number(p.planFee),
    extraFees: Number(p.extraFees),
    joiningFee: Number(p.joiningFee),
    lateFine: Number(p.lateFine),
    discount: Number(p.discount),
    isFirstPayment: p.isFirstPayment,
    notes: p.notes,
  }));

  return (
    <AdminFillPage>
      <div className="shrink-0 space-y-3 pb-4 md:space-y-4">
        <PageHeader
          className="!mb-0"
          title="Payment report"
          description={`Collections — ${reportMonthLabel(start)}`}
          actions={<ReportMonthPicker month={month} />}
        />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          <AdminCard className="p-3 md:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--admin-muted)] md:text-xs">
              Month collections
            </p>
            <p className="mt-1 text-xl font-semibold text-[var(--admin-navy)] md:mt-2 md:text-2xl">
              {formatINR(total)}
            </p>
            <p className="mt-0.5 text-[10px] text-[var(--admin-muted)] md:mt-1 md:text-sm">
              {collections.length} receipts
            </p>
          </AdminCard>
          <AdminCard className="p-3 md:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--admin-muted)] md:text-xs">
              By mode
            </p>
            <ul className="mt-2 space-y-1 text-xs text-[var(--admin-muted)] md:mt-3 md:text-sm">
              {Object.entries(byMode).map(([mode, amt]) => (
                <li key={mode} className="flex justify-between gap-2">
                  <span>{mode}</span>
                  <span className="font-medium text-gray-900">{formatINR(amt)}</span>
                </li>
              ))}
              {!Object.keys(byMode).length ? <li>No collections this month</li> : null}
            </ul>
          </AdminCard>
          <Link
            href={`/admin/reports/stock?month=${month}`}
            className="admin-card col-span-2 block p-3 transition hover:border-[var(--admin-navy)] md:col-span-1 md:p-5"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--admin-muted)] md:text-xs">
              Stock profit
            </p>
            <p
              className={`mt-1 text-xl font-semibold md:mt-2 md:text-2xl ${
                stockSales.profit >= 0 ? "text-emerald-600" : "text-[var(--admin-red)]"
              }`}
            >
              {formatINR(stockSales.profit)}
            </p>
            <p className="mt-0.5 text-[10px] text-[var(--admin-muted)] md:mt-1 md:text-sm">
              Sales {formatINR(stockSales.revenue)} · Cost {formatINR(stockSales.cost)} ·{" "}
              {stockSales.unitsSold} units
            </p>
          </Link>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <PaymentReportList collections={rows} fill />
      </div>
    </AdminFillPage>
  );
}
