"use client";

import {
  AdminEmptyRow,
  AdminResponsiveList,
  AdminListCard,
  AdminListSearch,
  matchesSearch,
} from "@/components/admin/ui";
import { PaymentReceiptModal } from "@/components/admin/PaymentReceiptModal";
import { formatDate, formatINR } from "@/lib/utils";

export type PaymentReportRow = {
  id: string;
  receiptNo: string;
  paidAt: string;
  mode: string;
  amountPaid: number;
  memberName: string;
  memberCode: string;
  monthsCovered: number;
  validUntil: string;
  planFee: number;
  extraFees: number;
  joiningFee: number;
  lateFine: number;
  discount: number;
  isFirstPayment: boolean;
  notes: string | null;
};

export function PaymentReportList({
  collections,
  fill,
}: {
  collections: PaymentReportRow[];
  fill?: boolean;
}) {
  return (
    <AdminListSearch fill={fill} placeholder="Search receipt, member, mode…">
      {(q) => {
        const filtered = collections.filter((p) =>
          matchesSearch(
            q,
            p.receiptNo,
            p.memberName,
            p.memberCode,
            p.mode,
            p.amountPaid,
            formatDate(p.paidAt),
          ),
        );

        return (
          <AdminResponsiveList
            fill={fill}
            cards={
              filtered.length ? (
                filtered.map((p) => (
                  <AdminListCard key={p.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <PaymentReceiptModal
                          payment={{
                            receiptNo: p.receiptNo,
                            memberName: p.memberName,
                            memberCode: p.memberCode,
                            paidAt: p.paidAt,
                            mode: p.mode,
                            monthsCovered: p.monthsCovered,
                            validUntil: p.validUntil,
                            planFee: p.planFee,
                            extraFees: p.extraFees,
                            joiningFee: p.joiningFee,
                            lateFine: p.lateFine,
                            discount: p.discount,
                            amountPaid: p.amountPaid,
                            isFirstPayment: p.isFirstPayment,
                            notes: p.notes,
                          }}
                        />
                        <p className="mt-1 text-sm text-gray-900">
                          {p.memberName} ({p.memberCode})
                        </p>
                        <p className="text-xs text-[var(--admin-muted)]">{formatDate(p.paidAt)}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-semibold text-[var(--admin-navy)]">
                          {formatINR(p.amountPaid)}
                        </p>
                        <p className="text-xs text-[var(--admin-muted)]">{p.mode}</p>
                      </div>
                    </div>
                  </AdminListCard>
                ))
              ) : (
                <AdminListCard>
                  <p className="text-center text-sm text-[var(--admin-muted)]">
                    {q ? "No matching collections." : "No collections this month."}
                  </p>
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
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <PaymentReceiptModal
                          payment={{
                            receiptNo: p.receiptNo,
                            memberName: p.memberName,
                            memberCode: p.memberCode,
                            paidAt: p.paidAt,
                            mode: p.mode,
                            monthsCovered: p.monthsCovered,
                            validUntil: p.validUntil,
                            planFee: p.planFee,
                            extraFees: p.extraFees,
                            joiningFee: p.joiningFee,
                            lateFine: p.lateFine,
                            discount: p.discount,
                            amountPaid: p.amountPaid,
                            isFirstPayment: p.isFirstPayment,
                            notes: p.notes,
                          }}
                        />
                      </td>
                      <td>
                        {p.memberName} ({p.memberCode})
                      </td>
                      <td>{formatDate(p.paidAt)}</td>
                      <td>{formatINR(p.amountPaid)}</td>
                      <td>{p.mode}</td>
                    </tr>
                  ))}
                  {!filtered.length ? (
                    <AdminEmptyRow
                      colSpan={5}
                      message={q ? "No matching collections." : "No collections this month."}
                    />
                  ) : null}
                </tbody>
              </table>
            }
          />
        );
      }}
    </AdminListSearch>
  );
}
