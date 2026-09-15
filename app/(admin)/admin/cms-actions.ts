"use server";

import { revalidatePath } from "next/cache";
import { requireSession, getActiveBranchId } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

function optionalDecimal(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export async function upsertStockItem(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "");
  const data = {
    name: String(formData.get("name")),
    sku: String(formData.get("sku") || "") || null,
    description: String(formData.get("description") || "") || null,
    costPrice: Number(formData.get("costPrice") || 0),
    salePrice: Number(formData.get("salePrice") || 0),
    lowStockAt: Number(formData.get("lowStockAt") || 5),
    isActive: true,
  };

  if (id) {
    await prisma.stockItem.update({ where: { id }, data });
  } else {
    const variantLabel = String(formData.get("variantLabel") || "").trim();
    if (!variantLabel) throw new Error("First variant label is required");
    const openingQty = Math.max(0, Number(formData.get("variantQuantity") || 0));
    await prisma.stockItem.create({
      data: {
        ...data,
        variants: {
          create: {
            label: variantLabel,
            quantity: openingQty,
            salePrice: optionalDecimal(formData.get("variantSalePrice")),
            costPrice: optionalDecimal(formData.get("variantCostPrice")),
          },
        },
      },
    });
  }
  revalidatePath("/admin/stock");
}

export async function addStockVariant(formData: FormData) {
  await requireSession();
  const itemId = String(formData.get("itemId"));
  const label = String(formData.get("label") || "").trim();
  if (!label) throw new Error("Variant label is required");

  const existing = await prisma.stockVariant.findUnique({
    where: { itemId_label: { itemId, label } },
  });
  if (existing) throw new Error(`A variant named “${label}” already exists`);

  await prisma.stockVariant.create({
    data: {
      itemId,
      label,
      quantity: Math.max(0, Number(formData.get("quantity") || 0)),
      salePrice: optionalDecimal(formData.get("salePrice")),
      costPrice: optionalDecimal(formData.get("costPrice")),
    },
  });
  revalidatePath("/admin/stock");
}

export async function deleteStockVariant(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id"));
  await prisma.$transaction([
    prisma.stockMovement.updateMany({
      where: { variantId: id },
      data: { variantId: null },
    }),
    prisma.stockVariant.delete({ where: { id } }),
  ]);
  revalidatePath("/admin/stock");
}

type MovementType = "PURCHASE" | "SALE" | "ISSUE" | "DAMAGE" | "TRANSFER_IN" | "TRANSFER_OUT";

type MovementLineInput = {
  itemId: string;
  variantId: string;
  quantity: number;
  unitPrice: number | null;
};

/** Single-line movement (kept for compatibility). Prefer recordStockMovements for the cart UI. */
export async function recordStockMovement(formData: FormData) {
  const type = String(formData.get("type")) as MovementType;
  const itemId = String(formData.get("itemId"));
  const variantId = String(formData.get("variantId") || "");
  const quantity = Math.abs(Number(formData.get("quantity") || 0));
  const unitPrice = formData.get("unitPrice") ? Number(formData.get("unitPrice")) : null;
  const memberId = String(formData.get("memberId") || "") || null;
  const notes = String(formData.get("notes") || "") || null;

  await recordStockMovementsInternal({
    type,
    memberId,
    notes,
    lines: [{ itemId, variantId, quantity, unitPrice }],
  });
}

/** Multi-line cart: one StockMovement (+ optional CashEntry) per line in a single transaction. */
export async function recordStockMovements(formData: FormData) {
  const type = String(formData.get("type")) as MovementType;
  const memberId = String(formData.get("memberId") || "") || null;
  const notes = String(formData.get("notes") || "") || null;
  const rawLines = String(formData.get("lines") || "[]");

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawLines);
  } catch {
    throw new Error("Invalid lines payload");
  }
  if (!Array.isArray(parsed) || !parsed.length) {
    throw new Error("Add at least one line");
  }

  const lines: MovementLineInput[] = parsed.map((row: Record<string, unknown>) => ({
    itemId: String(row.itemId || ""),
    variantId: String(row.variantId || ""),
    quantity: Math.abs(Number(row.quantity || 0)),
    unitPrice:
      row.unitPrice === "" || row.unitPrice === null || row.unitPrice === undefined
        ? null
        : Number(row.unitPrice),
  }));

  await recordStockMovementsInternal({ type, memberId, notes, lines });
}

async function recordStockMovementsInternal({
  type,
  memberId,
  notes,
  lines,
}: {
  type: MovementType;
  memberId: string | null;
  notes: string | null;
  lines: MovementLineInput[];
}) {
  const user = await requireSession();
  const branchId = (await getActiveBranchId(user))!;

  const allowed: MovementType[] = [
    "PURCHASE",
    "SALE",
    "ISSUE",
    "DAMAGE",
    "TRANSFER_IN",
    "TRANSFER_OUT",
  ];
  if (!allowed.includes(type)) throw new Error("Invalid movement type");

  for (const line of lines) {
    if (!line.itemId) throw new Error("Item required on each line");
    if (!line.variantId) throw new Error("Select a variant for each line");
    if (!line.quantity) throw new Error("Quantity required on each line");
  }

  const itemIds = [...new Set(lines.map((l) => l.itemId))];
  const items = await prisma.stockItem.findMany({
    where: { id: { in: itemIds } },
    include: { variants: true },
  });
  const itemById = new Map(items.map((i) => [i.id, i]));

  for (const line of lines) {
    const item = itemById.get(line.itemId);
    if (!item) throw new Error("Item not found");
    const variant = item.variants.find((v) => v.id === line.variantId);
    if (!variant) throw new Error("Invalid variant for item");

    const isOutbound =
      type === "SALE" || type === "ISSUE" || type === "DAMAGE" || type === "TRANSFER_OUT";
    if (isOutbound && line.quantity > variant.quantity) {
      throw new Error(
        `Not enough stock for ${item.name} — ${variant.label} (have ${variant.quantity})`,
      );
    }
  }

  const deltaSign =
    type === "PURCHASE" || type === "TRANSFER_IN"
      ? 1
      : type === "SALE" || type === "ISSUE" || type === "DAMAGE" || type === "TRANSFER_OUT"
        ? -1
        : 0;

  await prisma.$transaction(async (tx) => {
    const needsCash = type === "SALE" || type === "PURCHASE";
    const cashAccount = needsCash
      ? await tx.cashAccount.findFirst({
          where: { branchId, name: "Cash", isActive: true },
        })
      : null;

    for (const line of lines) {
      const item = itemById.get(line.itemId)!;
      await tx.stockVariant.update({
        where: { id: line.variantId },
        data: { quantity: { increment: deltaSign * line.quantity } },
      });

      const movement = await tx.stockMovement.create({
        data: {
          itemId: line.itemId,
          variantId: line.variantId,
          branchId,
          type,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          memberId,
          createdById: user.id,
          notes,
        },
      });

      if (type === "SALE" && line.unitPrice && line.unitPrice > 0 && cashAccount) {
        await tx.cashEntry.create({
          data: {
            accountId: cashAccount.id,
            branchId,
            type: "INCOME",
            source: "STOCK_SALE",
            amount: line.unitPrice * line.quantity,
            category: "Stock sale",
            description: notes ?? `Stock sale — ${item.name}`,
            entryDate: new Date(),
            stockMovementId: movement.id,
            createdById: user.id,
          },
        });
      }

      if (type === "PURCHASE" && line.unitPrice && line.unitPrice > 0 && cashAccount) {
        await tx.cashEntry.create({
          data: {
            accountId: cashAccount.id,
            branchId,
            type: "EXPENSE",
            source: "STOCK_PURCHASE",
            amount: line.unitPrice * line.quantity,
            category: "Stock purchase",
            description: notes ?? `Stock purchase — ${item.name}`,
            entryDate: new Date(),
            stockMovementId: movement.id,
            createdById: user.id,
          },
        });
      }
    }
  });

  revalidatePath("/admin/stock");
  revalidatePath("/admin/cashflow");
  revalidatePath("/admin/reports/cashflow");
  revalidatePath("/admin/reports/stock");
  revalidatePath("/admin/reports/payments");
  revalidatePath("/admin/dashboard");
}

export async function addCashEntry(formData: FormData) {
  const user = await requireSession();
  const branchId = (await getActiveBranchId(user))!;
  const type = String(formData.get("type") || "EXPENSE") as "INCOME" | "EXPENSE";
  if (type !== "INCOME" && type !== "EXPENSE") throw new Error("Invalid entry type");

  await prisma.cashEntry.create({
    data: {
      accountId: String(formData.get("accountId")),
      branchId,
      type,
      source: "MANUAL",
      amount: Number(formData.get("amount")),
      category: String(formData.get("category") || (type === "INCOME" ? "Other" : "Expense")),
      description: String(formData.get("description") || "") || null,
      entryDate: new Date(String(formData.get("entryDate") || new Date().toISOString())),
      createdById: user.id,
    },
  });
  revalidatePath("/admin/cashflow");
  revalidatePath("/admin/reports/cashflow");
  revalidatePath("/admin/dashboard");
}

function revalidateJourney() {
  revalidatePath("/admin/cms", "layout");
  revalidatePath("/");
  revalidatePath("/journey");
}

export async function upsertAchievement(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "");
  const currentYear = String(new Date().getFullYear());
  const data = {
    studentName: String(formData.get("studentName")),
    photoUrl: String(formData.get("photoUrl") || "") || null,
    event: String(formData.get("event")),
    result: String(formData.get("result")),
    year: currentYear,
    level: String(formData.get("level")),
    venue: String(formData.get("venue") || "") || null,
    summary: String(formData.get("summary") || "") || null,
    featured: formData.get("featured") === "on",
    isPublished: true,
  };
  if (id) {
    const existing = await prisma.achievement.findUnique({ where: { id } });
    if (existing?.photoUrl && existing.photoUrl !== data.photoUrl) {
      const { deleteR2ObjectByUrl } = await import("@/lib/r2");
      await deleteR2ObjectByUrl(existing.photoUrl);
    }
    await prisma.achievement.update({ where: { id }, data });
  } else {
    await prisma.achievement.create({ data });
  }
  revalidateJourney();
}

export async function deleteAchievement(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id"));
  const existing = await prisma.achievement.findUnique({ where: { id } });
  if (existing?.photoUrl) {
    const { deleteR2ObjectByUrl } = await import("@/lib/r2");
    await deleteR2ObjectByUrl(existing.photoUrl);
  }
  await prisma.achievement.delete({ where: { id } });
  revalidateJourney();
}

export async function upsertGalleryImage(formData: FormData) {
  await requireSession();
  const { CMS_LIMITS } = await import("@/lib/cms-limits");
  const count = await prisma.galleryImage.count();
  if (count >= CMS_LIMITS.galleryImages) {
    throw new Error(`Gallery is limited to ${CMS_LIMITS.galleryImages} images`);
  }
  const src = String(formData.get("src") || "").trim();
  if (!src) throw new Error("Image upload is required");
  await prisma.galleryImage.create({
    data: {
      src,
      alt: String(formData.get("alt")),
      category: String(formData.get("category")) as "TRAINING" | "EVENTS" | "MEDALS",
      featured: formData.get("featured") === "on",
      isPublished: true,
    },
  });
  revalidateJourney();
}

export async function deleteGalleryImage(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id"));
  const existing = await prisma.galleryImage.findUnique({ where: { id } });
  if (existing?.src) {
    const { deleteR2ObjectByUrl } = await import("@/lib/r2");
    await deleteR2ObjectByUrl(existing.src);
  }
  await prisma.galleryImage.delete({ where: { id } });
  revalidateJourney();
}

export async function upsertVideo(formData: FormData) {
  await requireSession();
  const { CMS_LIMITS } = await import("@/lib/cms-limits");
  const count = await prisma.video.count();
  if (count >= CMS_LIMITS.videos) {
    throw new Error(`Videos are limited to ${CMS_LIMITS.videos}`);
  }
  let youtubeId = String(formData.get("youtubeId") || "").trim();
  const watchMatch = youtubeId.match(/[?&]v=([^&]+)/);
  const shortMatch = youtubeId.match(/youtu\.be\/([^?&]+)/);
  if (watchMatch) youtubeId = watchMatch[1];
  else if (shortMatch) youtubeId = shortMatch[1];
  if (!youtubeId) throw new Error("YouTube ID is required");

  await prisma.video.create({
    data: {
      youtubeId,
      title: String(formData.get("title")),
      summary: String(formData.get("summary") || "") || null,
      isPublished: true,
    },
  });
  revalidateJourney();
}

export async function deleteVideo(formData: FormData) {
  await requireSession();
  await prisma.video.delete({ where: { id: String(formData.get("id")) } });
  revalidateJourney();
}

export async function upsertLeadershipPerson(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const position = String(formData.get("position") || "").trim();
  if (!name || !position) throw new Error("Name and position are required");

  const sortRaw = String(formData.get("sortOrder") || "").trim();
  const sortOrder = Math.max(0, Number(sortRaw || 0));
  if (!Number.isFinite(sortOrder)) throw new Error("Sort order must be a number");

  const photoUrl = String(formData.get("photoUrl") || "").trim() || null;

  if (id) {
    const existing = await prisma.leadershipPerson.findUnique({ where: { id } });
    if (!existing) throw new Error("Person not found");
    if (existing.photoUrl && photoUrl && existing.photoUrl !== photoUrl) {
      const { deleteR2ObjectByUrl } = await import("@/lib/r2");
      await deleteR2ObjectByUrl(existing.photoUrl);
    }
    await prisma.leadershipPerson.update({
      where: { id },
      data: {
        name,
        position,
        sortOrder,
        photoUrl: photoUrl ?? existing.photoUrl,
        isPublished: true,
      },
    });
  } else {
    const { CMS_LIMITS } = await import("@/lib/cms-limits");
    const count = await prisma.leadershipPerson.count();
    if (count >= CMS_LIMITS.leadership) {
      throw new Error(`Leadership is limited to ${CMS_LIMITS.leadership} people`);
    }
    await prisma.leadershipPerson.create({
      data: {
        name,
        position,
        photoUrl,
        sortOrder,
        isPublished: true,
      },
    });
  }
  revalidateJourney();
}

export async function deleteLeadershipPerson(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id"));
  const existing = await prisma.leadershipPerson.findUnique({ where: { id } });
  if (existing?.photoUrl) {
    const { deleteR2ObjectByUrl } = await import("@/lib/r2");
    await deleteR2ObjectByUrl(existing.photoUrl);
  }
  await prisma.leadershipPerson.delete({ where: { id } });
  revalidateJourney();
}

export async function saveTrialLead(formData: FormData) {
  const name = String(formData.get("name"));
  const phone = String(formData.get("phone"));
  const program = String(formData.get("program") || "") || null;
  const branch = String(formData.get("branch") || "") || null;
  const message = String(formData.get("message") || "") || null;
  await prisma.trialLead.create({ data: { name, phone, program, branch, message } });
}
