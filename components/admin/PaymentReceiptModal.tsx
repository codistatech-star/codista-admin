"use client";

import { AdminModal } from "@/components/admin/ui";
import { formatDate, formatINR } from "@/lib/utils";

export type PaymentReceiptData = {
  receiptNo: string;
  memberName: string;
  memberCode: string;
  paidAt: string;
  mode: string;
  monthsCovered: number;
  validUntil: string;
  planFee: number;
  extraFees: number;
  joiningFee: number;
  lateFine: number;
  discount: number;
  amountPaid: number;
  isFirstPayment: boolean;
  notes?: string | null;
};

function buildShareText(p: PaymentReceiptData) {
  const lines = [
    `Codista Receipt — ${p.receiptNo}`,
    `Member: ${p.memberName} (${p.memberCode})`,
    `Date: ${formatDate(p.paidAt)}`,
    `Period: ${p.monthsCovered} month${p.monthsCovered > 1 ? "s" : ""} · Valid until ${formatDate(p.validUntil)}`,
    `Mode: ${p.mode}`,
    "",
    "Breakdown:",
  ];
  if (p.planFee > 0) {
    lines.push(
      `Plan fee: ${formatINR(p.planFee)}${p.isFirstPayment ? " (first payment)" : " (renewal)"}`,
    );
  }
  if (p.extraFees > 0) lines.push(`Extra classes: ${formatINR(p.extraFees)}`);
  if (p.joiningFee > 0) lines.push(`Joining fee: ${formatINR(p.joiningFee)}`);
  if (p.lateFine > 0) lines.push(`Late fine: ${formatINR(p.lateFine)}`);
  if (p.discount > 0) lines.push(`Discount: −${formatINR(p.discount)}`);
  lines.push(`Total paid: ${formatINR(p.amountPaid)}`);
  if (p.notes?.trim()) lines.push(`Notes: ${p.notes.trim()}`);
  return lines.join("\n");
}

export function PaymentReceiptModal({ payment }: { payment: PaymentReceiptData }) {
  function shareWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(buildShareText(payment))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <AdminModal
      title={`Receipt ${payment.receiptNo}`}
      trigger={payment.receiptNo}
      triggerClassName="font-mono text-xs text-[var(--admin-navy)] underline-offset-2 hover:underline"
    >
      <div className="space-y-4 text-sm">
        <dl className="space-y-2">
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--admin-muted)]">Member</dt>
            <dd className="text-right font-medium text-gray-900">
              {payment.memberName} ({payment.memberCode})
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--admin-muted)]">Date</dt>
            <dd className="text-right text-gray-900">{formatDate(payment.paidAt)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--admin-muted)]">Mode</dt>
            <dd className="text-right text-gray-900">{payment.mode}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--admin-muted)]">Period</dt>
            <dd className="text-right text-gray-900">
              {payment.monthsCovered} month{payment.monthsCovered > 1 ? "s" : ""}
              <span className="block text-xs text-[var(--admin-muted)]">
                Valid until {formatDate(payment.validUntil)}
              </span>
            </dd>
          </div>
        </dl>

        <div className="rounded-lg border border-[var(--admin-border)] bg-gray-50 p-3">
          <p className="mb-2 font-semibold text-gray-900">Breakdown</p>
          <ul className="space-y-1">
            {payment.planFee > 0 ? (
              <li className="flex justify-between gap-4">
                <span>
                  Plan fee
                  {payment.isFirstPayment ? " (first)" : " (renewal)"}
                </span>
                <span className="font-medium">{formatINR(payment.planFee)}</span>
              </li>
            ) : null}
            {payment.extraFees > 0 ? (
              <li className="flex justify-between gap-4">
                <span>Extra classes</span>
                <span className="font-medium">{formatINR(payment.extraFees)}</span>
              </li>
            ) : null}
            {payment.joiningFee > 0 ? (
              <li className="flex justify-between gap-4">
                <span>Joining fee</span>
                <span className="font-medium">{formatINR(payment.joiningFee)}</span>
              </li>
            ) : null}
            {payment.lateFine > 0 ? (
              <li className="flex justify-between gap-4">
                <span>Late fine</span>
                <span className="font-medium">{formatINR(payment.lateFine)}</span>
              </li>
            ) : null}
            {payment.discount > 0 ? (
              <li className="flex justify-between gap-4 text-[var(--admin-muted)]">
                <span>Discount</span>
                <span className="font-medium">−{formatINR(payment.discount)}</span>
              </li>
            ) : null}
            <li className="mt-2 flex justify-between gap-4 border-t border-[var(--admin-border)] pt-2 text-base">
              <span className="font-semibold text-gray-900">Total paid</span>
              <span className="font-semibold text-[var(--admin-red)]">
                {formatINR(payment.amountPaid)}
              </span>
            </li>
          </ul>
          {payment.notes?.trim() ? (
            <p className="mt-3 text-xs text-[var(--admin-muted)]">Notes: {payment.notes.trim()}</p>
          ) : null}
        </div>

        <button type="button" className="btn-primary w-full" onClick={shareWhatsApp}>
          Share on WhatsApp
        </button>
      </div>
    </AdminModal>
  );
}
