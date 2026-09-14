import { addMonths, differenceInCalendarDays, getDaysInMonth, startOfDay } from "date-fns";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type FeeSlab = { fromDay: number; toDay: number; percent: number };

/** @deprecated use FeeSlab */
export type JoiningSlab = FeeSlab;

export type MembershipStatus = "ACTIVE" | "EXPIRING" | "EXPIRED" | "INACTIVE" | "NONE";

export function membershipStatus(
  isActive: boolean,
  validUntil: Date | null | undefined,
  expiringSoonDays: number,
  today = new Date(),
): MembershipStatus {
  if (!isActive) return "INACTIVE";
  if (!validUntil) return "NONE";
  const days = differenceInCalendarDays(startOfDay(validUntil), startOfDay(today));
  if (days < 0) return "EXPIRED";
  if (days <= expiringSoonDays) return "EXPIRING";
  return "ACTIVE";
}

export function statusLabel(status: MembershipStatus) {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "EXPIRING":
      return "Expiring";
    case "EXPIRED":
      return "Expired";
    case "INACTIVE":
      return "Inactive";
    default:
      return "No membership";
  }
}

/** Day-of-month charge % for plan fee (e.g. 1–10 → 100%, 11–15 → 50%). */
export function planFeeChargePercent(dayOfMonth: number, slabs: FeeSlab[]) {
  const slab = slabs.find((s) => dayOfMonth >= s.fromDay && dayOfMonth <= s.toDay);
  return slab?.percent ?? 0;
}

/** @deprecated use planFeeChargePercent */
export function joiningFeeChargePercent(dayOfMonth: number, slabs: FeeSlab[]) {
  return planFeeChargePercent(dayOfMonth, slabs);
}

/** @deprecated use planFeeChargePercent */
export function joiningFeeDiscountPercent(dayOfMonth: number, slabs: FeeSlab[]) {
  return planFeeChargePercent(dayOfMonth, slabs);
}

export function toNumber(value: number | string | { toString(): string }) {
  return typeof value === "number" ? value : Number(value);
}

/** Advance `months` from baseFrom, then set day to feeDay (clamped to month length). */
export function validUntilOnFeeDay(baseFrom: Date, months: number, feeDay: number) {
  const advanced = addMonths(baseFrom, months);
  const day = Math.min(Math.max(1, feeDay), 28);
  const clamped = Math.min(day, getDaysInMonth(advanced));
  return new Date(advanced.getFullYear(), advanced.getMonth(), clamped);
}

export const getAcademySettings = cache(async () => {
  return (
    (await prisma.academySettings.findUnique({ where: { id: "default" } })) ??
    (await prisma.academySettings.create({
      data: {
        id: "default",
        joiningFeeSlabs: [
          { fromDay: 1, toDay: 10, percent: 100 },
          { fromDay: 11, toDay: 15, percent: 50 },
        ],
        monthlyFeeDay: 10,
      },
    }))
  );
});

export async function computePaymentQuote(memberId: string, paidAt = new Date()) {
  const settings = await getAcademySettings();
  const member = await prisma.member.findUniqueOrThrow({
    where: { id: memberId },
    include: {
      classPlan: true,
      extraClasses: { include: { extraClass: true } },
      membership: true,
      payments: { select: { id: true }, take: 1 },
    },
  });

  const fullPlanFee = toNumber(member.classPlan.fee);
  const extraFees = member.extraClasses.reduce(
    (sum, row) => sum + toNumber(row.extraClass.fee),
    0,
  );

  const isFirstPayment = member.payments.length === 0;
  const slabs = (settings.joiningFeeSlabs as FeeSlab[]) ?? [];
  const day = paidAt.getDate();
  // Cutoff slabs apply to plan fee (typically first/join payment); renewals charge full plan fee.
  const chargePct = isFirstPayment ? planFeeChargePercent(day, slabs) : 100;
  const planFee = Math.round((fullPlanFee * chargePct) / 100);
  const joiningFee = isFirstPayment ? toNumber(settings.joiningFee) : 0;

  let lateFine = 0;
  if (member.membership && member.membership.validUntil < paidAt) {
    lateFine = toNumber(settings.lateFineAmount);
  }

  const months = settings.membershipMonths;
  const feeDay = settings.monthlyFeeDay ?? 10;
  const baseFrom =
    member.membership && member.membership.validUntil > paidAt
      ? member.membership.validUntil
      : paidAt;
  const validUntil = validUntilOnFeeDay(baseFrom, months, feeDay);

  const subtotal = planFee + extraFees + joiningFee + lateFine;

  return {
    member,
    settings,
    planFee,
    fullPlanFee,
    planFeeChargePercent: chargePct,
    extraFees,
    joiningFee,
    lateFine,
    isFirstPayment,
    monthsCovered: months,
    validUntil,
    subtotal,
  };
}

/** Client-safe fee preview for registration before the member exists. */
export function previewRegistrationFees(input: {
  planFee: number;
  extraFees: number;
  joiningFee: number;
  slabs: FeeSlab[];
  paidAt?: Date;
}) {
  const paidAt = input.paidAt ?? new Date();
  const chargePct = planFeeChargePercent(paidAt.getDate(), input.slabs);
  const planFee = Math.round((input.planFee * chargePct) / 100);
  const joiningFee = input.joiningFee;
  const extraFees = input.extraFees;
  return {
    planFee,
    fullPlanFee: input.planFee,
    planFeeChargePercent: chargePct,
    extraFees,
    joiningFee,
    lateFine: 0,
    isFirstPayment: true,
    subtotal: planFee + extraFees + joiningFee,
  };
}

export type PaymentQuoteDTO = {
  planFee: number;
  fullPlanFee?: number;
  planFeeChargePercent?: number;
  extraFees: number;
  joiningFee: number;
  lateFine: number;
  isFirstPayment: boolean;
  monthsCovered: number;
  validUntil: string;
  subtotal: number;
  memberCode: string;
  memberName: string;
};

export async function nextReceiptNo() {
  const settings = await getAcademySettings();
  const year = new Date().getFullYear();
  const prefix = `${settings.receiptPrefix}-${year}-`;
  const latest = await prisma.payment.findFirst({
    where: { receiptNo: { startsWith: prefix } },
    orderBy: { receiptNo: "desc" },
  });
  const next = latest ? Number(latest.receiptNo.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(next).padStart(5, "0")}`;
}

export async function nextMemberCode() {
  const count = await prisma.member.count();
  return `ST${String(count + 1).padStart(3, "0")}`;
}
