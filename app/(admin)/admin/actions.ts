"use server";

import { hash } from "bcryptjs";
import { revalidatePath, revalidateTag } from "next/cache";
import { Role } from "@prisma/client";
import { requireAdmin, requireSession, getActiveBranchId, canAccessBranch } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  computePaymentQuote,
  nextMemberCode,
  nextReceiptNo,
  getAcademySettings,
} from "@/lib/membership";

function parseSlabs(raw: string) {
  const slabs = JSON.parse(raw) as { fromDay: number; toDay: number; percent: number }[];
  return slabs;
}

export async function saveAcademySettings(formData: FormData) {
  await requireAdmin();
  const rawFeeDay = Number(formData.get("monthlyFeeDay"));
  const monthlyFeeDay = Math.min(28, Math.max(1, Number.isFinite(rawFeeDay) ? rawFeeDay : 10));
  const joiningFee = Math.max(0, Number(formData.get("joiningFee") || 0));
  await prisma.academySettings.update({
    where: { id: "default" },
    data: {
      joiningFee,
      joiningFeeSlabs: parseSlabs(String(formData.get("joiningFeeSlabs") || "[]")),
      expiringSoonDays: Number(formData.get("expiringSoonDays")),
      monthlyFeeDay,
      allowAttendanceWhenExpired: formData.get("allowAttendanceWhenExpired") === "on",
      lateFineAmount: Number(formData.get("lateFineAmount")),
      receiptPrefix: String(formData.get("receiptPrefix") || "COD"),
    },
  });
  revalidatePath("/admin/settings", "layout");
}

export async function upsertClassPlan(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const data = {
    name: String(formData.get("name")),
    fee: Number(formData.get("fee")),
    sortOrder: Number(formData.get("sortOrder") || 0),
    isActive: formData.get("isActive") !== "off",
  };
  if (id) await prisma.classPlan.update({ where: { id }, data });
  else await prisma.classPlan.create({ data });
  revalidatePath("/admin/settings", "layout");
}

export async function upsertExtraClass(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const data = {
    name: String(formData.get("name")),
    fee: Number(formData.get("fee")),
    sortOrder: Number(formData.get("sortOrder") || 0),
    isActive: formData.get("isActive") !== "off",
  };
  if (id) await prisma.extraClass.update({ where: { id }, data });
  else await prisma.extraClass.create({ data });
  revalidatePath("/admin/settings", "layout");
}

export async function upsertBatch(formData: FormData) {
  const user = await requireSession();
  const branchId = (await getActiveBranchId(user))!;
  const id = String(formData.get("id") || "");
  const data = {
    name: String(formData.get("name")),
    branchId,
    sortOrder: Number(formData.get("sortOrder") || 0),
    isActive: true,
  };
  if (id) await prisma.batch.update({ where: { id }, data });
  else await prisma.batch.create({ data });
  revalidatePath("/admin/settings", "layout");
}

export async function upsertBelt(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const data = {
    name: String(formData.get("name")),
    sortOrder: Number(formData.get("sortOrder") || 0),
    isActive: true,
  };
  if (id) await prisma.beltGrade.update({ where: { id }, data });
  else await prisma.beltGrade.create({ data });
  revalidatePath("/admin/settings", "layout");
}

export async function createBranch(formData: FormData) {
  await requireAdmin();
  const branch = await prisma.branch.create({
    data: {
      name: String(formData.get("name")),
      address: String(formData.get("address") || "") || null,
      phone: String(formData.get("phone") || "") || null,
      isActive: true,
    },
  });
  for (const accountName of ["Cash", "UPI", "Bank"]) {
    await prisma.cashAccount.create({
      data: { name: accountName, branchId: branch.id },
    });
  }
  revalidateTag("admin-branches");
  revalidatePath("/admin/settings", "layout");
}

export async function setClassPlanActive(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const isActive = formData.get("isActive") === "true";
  await prisma.classPlan.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/settings", "layout");
}

export async function setExtraClassActive(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const isActive = formData.get("isActive") === "true";
  await prisma.extraClass.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/settings", "layout");
}

export async function setBatchActive(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id"));
  const isActive = formData.get("isActive") === "true";
  await prisma.batch.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/settings", "layout");
}

export async function setBeltActive(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const isActive = formData.get("isActive") === "true";
  await prisma.beltGrade.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/settings", "layout");
}

export async function setBranchActive(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const isActive = formData.get("isActive") === "true";
  await prisma.branch.update({ where: { id }, data: { isActive } });
  revalidateTag("admin-branches");
  revalidatePath("/admin/settings", "layout");
}

export async function createBranchAdmin(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email")).toLowerCase();
  const name = String(formData.get("name"));
  const password = String(formData.get("password"));
  const branchIds = formData.getAll("branchIds").map(String);
  const passwordHash = await hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: Role.BRANCH_ADMIN,
      isActive: true,
      branches: {
        create: branchIds.map((branchId) => ({ branchId })),
      },
    },
  });
  revalidatePath("/admin/settings", "layout");
  return user.id;
}

export async function revokeBranchAdmin(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const user = await prisma.user.findUniqueOrThrow({ where: { id } });
  if (user.role === Role.ADMIN) throw new Error("Cannot revoke Admin");
  await prisma.user.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/admin/settings", "layout");
}

export async function reactivateBranchAdmin(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.user.update({ where: { id }, data: { isActive: true } });
  revalidatePath("/admin/settings", "layout");
}

export async function saveMember(formData: FormData) {
  const user = await requireSession();
  const branchId = (await getActiveBranchId(user))!;
  if (!canAccessBranch(user, branchId)) throw new Error("Forbidden");

  const id = String(formData.get("id") || "");
  const batchIds = formData.getAll("batchIds").map(String);
  const extraClassIds = formData.getAll("extraClassIds").map(String);
  const primaryBatchId = String(formData.get("primaryBatchId") || batchIds[0] || "");

  const mobile = String(formData.get("mobile") || "").replace(/\D/g, "").slice(-10);
  if (!/^\d{10}$/.test(mobile)) throw new Error("Mobile must be a 10-digit number");
  const fatherContactRaw = String(formData.get("fatherContact") || "").replace(/\D/g, "").slice(-10);
  const fatherContact = fatherContactRaw
    ? /^\d{10}$/.test(fatherContactRaw)
      ? fatherContactRaw
      : (() => {
          throw new Error("Father contact must be a 10-digit number");
        })()
    : null;

  const data = {
    name: String(formData.get("name")),
    gender: String(formData.get("gender")),
    dob: new Date(String(formData.get("dob"))),
    address: String(formData.get("address")),
    mobile,
    joiningDate: new Date(String(formData.get("joiningDate"))),
    schoolClass: String(formData.get("schoolClass") || "") || null,
    institute: String(formData.get("institute") || "") || null,
    fatherName: String(formData.get("fatherName") || "") || null,
    fatherContact,
    fatherOccupation: String(formData.get("fatherOccupation") || "") || null,
    bloodGroup: String(formData.get("bloodGroup") || "") || null,
    heightCm: formData.get("heightCm") ? Number(formData.get("heightCm")) : null,
    weightKg: formData.get("weightKg") ? Number(formData.get("weightKg")) : null,
    passportNumber: String(formData.get("passportNumber") || "") || null,
    allergic: String(formData.get("allergic") || "") || null,
    medicines: String(formData.get("medicines") || "") || null,
    classPlanId: String(formData.get("classPlanId")),
    beltGradeId: String(formData.get("beltGradeId")),
    branchId,
  };

  let memberId = id;
  let code = "";
  if (id) {
    const updated = await prisma.member.update({ where: { id }, data });
    code = updated.code;
    await prisma.memberBatch.deleteMany({ where: { memberId: id } });
    await prisma.memberExtraClass.deleteMany({ where: { memberId: id } });
  } else {
    code = await nextMemberCode();
    const created = await prisma.member.create({ data: { ...data, code } });
    memberId = created.id;
  }

  if (batchIds.length) {
    await prisma.memberBatch.createMany({
      data: batchIds.map((batchId) => ({
        memberId,
        batchId,
        isPrimary: batchId === primaryBatchId,
      })),
    });
  }
  if (extraClassIds.length) {
    await prisma.memberExtraClass.createMany({
      data: extraClassIds.map((extraClassId) => ({ memberId, extraClassId })),
    });
  }

  revalidatePath("/admin/members");
  return { id: memberId, code };
}

export async function setMemberActive(formData: FormData) {
  const user = await requireSession();
  const id = String(formData.get("id"));
  const isActive = formData.get("isActive") === "true";
  const member = await prisma.member.findUniqueOrThrow({ where: { id } });
  if (!canAccessBranch(user, member.branchId)) throw new Error("Forbidden");
  await prisma.member.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/members");
}

export async function getPaymentQuote(memberId: string) {
  const user = await requireSession();
  const quote = await computePaymentQuote(memberId);
  if (!canAccessBranch(user, quote.member.branchId)) throw new Error("Forbidden");
  return {
    planFee: quote.planFee,
    fullPlanFee: quote.fullPlanFee,
    planFeeChargePercent: quote.planFeeChargePercent,
    extraFees: quote.extraFees,
    joiningFee: quote.joiningFee,
    lateFine: quote.lateFine,
    isFirstPayment: quote.isFirstPayment,
    monthsCovered: quote.monthsCovered,
    validUntil: quote.validUntil.toISOString(),
    subtotal: quote.subtotal,
    memberCode: quote.member.code,
    memberName: quote.member.name,
  };
}

export async function collectPayment(formData: FormData) {
  const user = await requireSession();
  const memberId = String(formData.get("memberId"));
  const discount = Number(formData.get("discount") || 0);
  const mode = String(formData.get("mode")) as "CASH" | "UPI" | "BANK";
  const notes = String(formData.get("notes") || "") || null;
  const paidAt = new Date(String(formData.get("paidAt") || new Date().toISOString()));

  const quote = await computePaymentQuote(memberId, paidAt);
  if (!canAccessBranch(user, quote.member.branchId)) throw new Error("Forbidden");

  const amountPaid = Math.max(0, quote.subtotal - discount);
  const receiptNo = await nextReceiptNo();

  const account = await prisma.cashAccount.findFirst({
    where: {
      branchId: quote.member.branchId,
      name: mode === "CASH" ? "Cash" : mode === "UPI" ? "UPI" : "Bank",
      isActive: true,
    },
  });
  if (!account) throw new Error("Cash account missing for branch");

  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        receiptNo,
        memberId,
        branchId: quote.member.branchId,
        collectedById: user.id,
        paidAt,
        planFee: quote.planFee,
        extraFees: quote.extraFees,
        joiningFee: quote.joiningFee,
        lateFine: quote.lateFine,
        discount,
        amountPaid,
        mode,
        monthsCovered: quote.monthsCovered,
        validUntil: quote.validUntil,
        notes,
        isFirstPayment: quote.isFirstPayment,
      },
    });

    await tx.membership.upsert({
      where: { memberId },
      create: {
        memberId,
        validFrom: paidAt,
        validUntil: quote.validUntil,
      },
      update: {
        validUntil: quote.validUntil,
      },
    });

    await tx.cashEntry.create({
      data: {
        accountId: account.id,
        branchId: quote.member.branchId,
        type: "INCOME",
        source: "MEMBERSHIP",
        amount: amountPaid,
        category: "Membership",
        description: `Receipt ${receiptNo} — ${quote.member.name}`,
        entryDate: paidAt,
        paymentId: payment.id,
        createdById: user.id,
      },
    });
  });

  revalidatePath("/admin/reports/payments");
  revalidatePath("/admin/members");
  revalidatePath("/admin/cashflow");
  revalidatePath("/admin/dashboard");
  return receiptNo;
}

export async function markAttendance(formData: FormData) {
  const user = await requireSession();
  const branchId = (await getActiveBranchId(user))!;
  const date = new Date(String(formData.get("date")));
  const batchId = String(formData.get("batchId"));
  const takenById = String(formData.get("takenById") || "") || user.id;
  const settings = await getAcademySettings();

  const session = await prisma.attendanceSession.upsert({
    where: {
      date_batchId_branchId: { date, batchId, branchId },
    },
    create: { date, batchId, branchId, takenById },
    update: { takenById },
  });

  const memberId = String(formData.get("memberId"));
  const isPresent = formData.get("isPresent") === "true";

  const member = await prisma.member.findUniqueOrThrow({
    where: { id: memberId },
    include: { membership: true },
  });
  if (!member.isActive) throw new Error("Member inactive");
  if (
    !settings.allowAttendanceWhenExpired &&
    member.membership &&
    member.membership.validUntil < date
  ) {
    throw new Error("Membership expired — attendance blocked by settings");
  }

  await prisma.attendanceEntry.upsert({
    where: { sessionId_memberId: { sessionId: session.id, memberId } },
    create: { sessionId: session.id, memberId, isPresent },
    update: { isPresent },
  });

  revalidatePath("/admin/attendance");
}
