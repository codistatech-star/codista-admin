import {
  PageHeader,
  AdminCard,
  AdminEmptyRow,
  AdminResponsiveList,
  AdminListCard,
} from "@/components/admin/ui";
import { PaymentReceiptModal } from "@/components/admin/PaymentReceiptModal";
import { ReportMonthPicker } from "@/components/admin/ReportMonthPicker";
import { getActiveBranchId, requireSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { parseReportMonth, reportMonthLabel } from "@/lib/report-month";
import { formatDate, formatINR } from "@/lib/utils";

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

  const collections = await prisma.payment.findMany({
    where: { branchId, paidAt: { gte: start, lt: end } },
    include: { member: true },
    orderBy: { paidAt: "desc" },
  });
  const total = collections.reduce((n, p) => n + Number(p.amountPaid), 0);
  const byMode = collections.reduce(
    (acc, p) => {
      acc[p.mode] = (acc[p.mode] ?? 0) + Number(p.amountPaid);
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment report"
        description={`Collections — ${reportMonthLabel(start)}`}
        actions={<ReportMonthPicker month={month} />}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
            Month collections
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--admin-navy)]">{formatINR(total)}</p>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">{collections.length} receipts</p>
        </AdminCard>
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-muted)]">By mode</p>
          <ul className="mt-3 space-y-1 text-sm text-[var(--admin-muted)]">
            {Object.entries(byMode).map(([mode, amt]) => (
              <li key={mode} className="flex justify-between">
                <span>{mode}</span>
                <span className="font-medium text-gray-900">{formatINR(amt)}</span>
              </li>
            ))}
            {!Object.keys(byMode).length ? <li>No collections this month</li> : null}
          </ul>
        </AdminCard>
      </div>

      <AdminResponsiveList
        cards={
          collections.length ? (
            collections.map((p) => (
              <AdminListCard key={p.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <PaymentReceiptModal
                      payment={{
                        receiptNo: p.receiptNo,
                        memberName: p.member.name,
                        memberCode: p.member.code,
                        paidAt: p.paidAt.toISOString(),
                        mode: p.mode,
                        monthsCovered: p.monthsCovered,
                        validUntil: p.validUntil.toISOString(),
                        planFee: Number(p.planFee),
                        extraFees: Number(p.extraFees),
                        joiningFee: Number(p.joiningFee),
                        lateFine: Number(p.lateFine),
                        discount: Number(p.discount),
                        amountPaid: Number(p.amountPaid),
                        isFirstPayment: p.isFirstPayment,
                        notes: p.notes,
                      }}
                    />
                    <p className="mt-1 text-sm text-gray-900">
                      {p.member.name} ({p.member.code})
                    </p>
                    <p className="text-xs text-[var(--admin-muted)]">{formatDate(p.paidAt)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold text-[var(--admin-navy)]">
                      {formatINR(Number(p.amountPaid))}
                    </p>
                    <p className="text-xs text-[var(--admin-muted)]">{p.mode}</p>
                  </div>
                </div>
              </AdminListCard>
            ))
          ) : (
            <AdminListCard>
              <p className="text-center text-sm text-[var(--admin-muted)]">No collections this month.</p>
            </AdminListCard>
          )
        }
        table={
          <table className="admin-table">
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Member</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Mode</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((p) => (
                <tr key={p.id}>
                  <td>
                    <PaymentReceiptModal
                      payment={{
                        receiptNo: p.receiptNo,
                        memberName: p.member.name,
                        memberCode: p.member.code,
                        paidAt: p.paidAt.toISOString(),
                        mode: p.mode,
                        monthsCovered: p.monthsCovered,
                        validUntil: p.validUntil.toISOString(),
                        planFee: Number(p.planFee),
                        extraFees: Number(p.extraFees),
                        joiningFee: Number(p.joiningFee),
                        lateFine: Number(p.lateFine),
                        discount: Number(p.discount),
                        amountPaid: Number(p.amountPaid),
                        isFirstPayment: p.isFirstPayment,
                        notes: p.notes,
                      }}
                    />
                  </td>
                  <td>
                    {p.member.name} ({p.member.code})
                  </td>
                  <td>{formatDate(p.paidAt)}</td>
                  <td>{formatINR(Number(p.amountPaid))}</td>
                  <td>{p.mode}</td>
                </tr>
              ))}
              {!collections.length ? (
                <AdminEmptyRow colSpan={5} message="No collections this month." />
              ) : null}
            </tbody>
          </table>
        }
      />
    </div>
  );
}
