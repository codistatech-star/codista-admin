"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminSelect, AdminDatePicker, SubmitButton } from "@/components/admin/ui";
import { collectPayment, getPaymentQuote } from "@/app/(admin)/admin/actions";
import type { PaymentQuoteDTO } from "@/lib/membership";
import { formatDate, formatINR } from "@/lib/utils";

export type CollectMemberOption = { id: string; code: string; name: string };

export function CollectPaymentForm({
  members,
  memberId: fixedMemberId,
  onSuccess,
  redirectAfter = true,
}: {
  members?: CollectMemberOption[];
  memberId?: string;
  onSuccess?: (result: { receiptNo: string; memberCode?: string }) => void;
  /** When true (default), refresh the current page after collect. */
  redirectAfter?: boolean;
}) {
  const router = useRouter();
  const [memberId, setMemberId] = useState(fixedMemberId ?? "");
  const [quote, setQuote] = useState<PaymentQuoteDTO | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [pending, startTransition] = useTransition();
  const paidAtDefault = new Date().toISOString().slice(0, 16);

  useEffect(() => {
    if (fixedMemberId) setMemberId(fixedMemberId);
  }, [fixedMemberId]);

  useEffect(() => {
    if (!memberId) {
      setQuote(null);
      setQuoteError(null);
      return;
    }
    let cancelled = false;
    setLoadingQuote(true);
    setQuoteError(null);
    getPaymentQuote(memberId)
      .then((q) => {
        if (!cancelled) setQuote(q);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setQuote(null);
          setQuoteError(err instanceof Error ? err.message : "Failed to load quote");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingQuote(false);
      });
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const receiptNo = await collectPayment(formData);
        onSuccess?.({ receiptNo, memberCode: quote?.memberCode });
        if (redirectAfter) router.refresh();
      } catch (err) {
        setQuoteError(err instanceof Error ? err.message : "Payment failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      <form action={handleSubmit} className="space-y-4">
        {fixedMemberId ? (
          <input type="hidden" name="memberId" value={fixedMemberId} />
        ) : (
          <label className="admin-label">
            Member
            <AdminSelect
              className="mt-1"
              name="memberId"
              required
              value={memberId}
              onChange={(id) => setMemberId(id)}
              placeholder="Select member"
              options={(members ?? []).map((m) => ({
                value: m.id,
                label: `${m.code} — ${m.name}`,
              }))}
            />
          </label>
        )}

        {fixedMemberId && quote ? (
          <p className="text-sm text-[var(--admin-muted)]">
            {quote.memberCode} — {quote.memberName}
          </p>
        ) : null}

        <label className="admin-label">
          Discount (₹)
          <input className="admin-input mt-1" name="discount" type="number" defaultValue={0} />
        </label>
        <label className="admin-label">
          Mode
          <AdminSelect
            className="mt-1"
            name="mode"
            required
            options={[
              { value: "CASH", label: "Cash" },
              { value: "UPI", label: "UPI" },
              { value: "BANK", label: "Bank" },
            ]}
          />
        </label>
        <label className="admin-label">
          Paid at
          <AdminDatePicker
            className="mt-1"
            name="paidAt"
            withTime
            defaultValue={paidAtDefault}
            timeDefault={paidAtDefault.slice(11, 16) || "00:00"}
          />
        </label>
        <label className="admin-label">
          Notes
          <textarea className="admin-input mt-1" name="notes" rows={2} />
        </label>

        <div className="rounded-lg border border-[var(--admin-border)] bg-gray-50 p-3 text-sm">
          <p className="mb-2 font-semibold text-gray-900">Quote preview</p>
          {loadingQuote ? (
            <p className="text-[var(--admin-muted)]">Loading quote…</p>
          ) : quoteError ? (
            <p className="text-[var(--admin-red)]">{quoteError}</p>
          ) : quote ? (
            <div className="space-y-1">
              <p>
                Plan fee: <strong>{formatINR(quote.planFee)}</strong>
                {quote.isFirstPayment && quote.planFeeChargePercent !== 100
                  ? ` (${quote.planFeeChargePercent}% of plan — day cutoff)`
                  : quote.isFirstPayment
                    ? " (first payment)"
                    : " (renewal)"}
              </p>
              <p>
                Extra classes: <strong>{formatINR(quote.extraFees)}</strong>
              </p>
              <p>
                Joining fee: <strong>{formatINR(quote.joiningFee)}</strong>
                {quote.isFirstPayment ? " (first payment)" : " (renewal — not charged)"}
              </p>
              <p>
                Late fine: <strong>{formatINR(quote.lateFine)}</strong>
              </p>
              <p className="mt-2 text-base">
                Subtotal:{" "}
                <strong className="text-[var(--admin-red)]">{formatINR(quote.subtotal)}</strong>
              </p>
              <p className="text-[var(--admin-muted)]">
                New valid until: {formatDate(quote.validUntil)} ({quote.monthsCovered} month
                {quote.monthsCovered > 1 ? "s" : ""})
              </p>
            </div>
          ) : (
            <p className="text-[var(--admin-muted)]">Select a member to preview the quote.</p>
          )}
        </div>

        <SubmitButton className="w-full" disabled={!memberId || !quote || pending}>
          {pending ? "Saving…" : "Save receipt & extend membership"}
        </SubmitButton>
      </form>
    </div>
  );
}
