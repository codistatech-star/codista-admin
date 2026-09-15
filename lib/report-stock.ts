import { prisma } from "@/lib/prisma";

export type StockSaleLine = {
  id: string;
  createdAt: Date;
  itemName: string;
  variantLabel: string | null;
  memberName: string | null;
  memberCode: string | null;
  quantity: number;
  unitSale: number;
  unitCost: number;
  revenue: number;
  cost: number;
  profit: number;
};

export type StockSalesReport = {
  unitsSold: number;
  revenue: number;
  cost: number;
  profit: number;
  lines: StockSaleLine[];
};

type Decimalish = { toString(): string } | number | null | undefined;

function toNum(value: Decimalish, fallback = 0): number {
  if (value == null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Build stock sales + profit for a branch month from SALE movements. */
export function buildStockSalesReport(
  movements: {
    id: string;
    createdAt: Date;
    quantity: number;
    unitPrice: Decimalish;
    item: {
      name: string;
      salePrice: Decimalish;
      costPrice: Decimalish;
    };
    variant: {
      label: string;
      salePrice: Decimalish;
      costPrice: Decimalish;
    } | null;
    member: { name: string; code: string } | null;
  }[],
): StockSalesReport {
  const lines: StockSaleLine[] = movements.map((m) => {
    const catalogueSale = toNum(m.variant?.salePrice ?? m.item.salePrice);
    const unitCost = toNum(m.variant?.costPrice ?? m.item.costPrice);
    const unitSale = m.unitPrice != null ? toNum(m.unitPrice) : catalogueSale;
    const qty = m.quantity;
    const revenue = unitSale * qty;
    const cost = unitCost * qty;
    return {
      id: m.id,
      createdAt: m.createdAt,
      itemName: m.item.name,
      variantLabel: m.variant?.label ?? null,
      memberName: m.member?.name ?? null,
      memberCode: m.member?.code ?? null,
      quantity: qty,
      unitSale,
      unitCost,
      revenue,
      cost,
      profit: revenue - cost,
    };
  });

  return {
    unitsSold: lines.reduce((n, l) => n + l.quantity, 0),
    revenue: lines.reduce((n, l) => n + l.revenue, 0),
    cost: lines.reduce((n, l) => n + l.cost, 0),
    profit: lines.reduce((n, l) => n + l.profit, 0),
    lines,
  };
}

/** Fetch SALE movements for a branch in [start, end) and build the sales report. */
export async function getStockSalesReport(input: {
  branchId: string;
  start: Date;
  end: Date;
}): Promise<StockSalesReport> {
  const movements = await prisma.stockMovement.findMany({
    where: {
      branchId: input.branchId,
      type: "SALE",
      createdAt: { gte: input.start, lt: input.end },
    },
    include: {
      item: { select: { name: true, salePrice: true, costPrice: true } },
      variant: { select: { label: true, salePrice: true, costPrice: true } },
      member: { select: { name: true, code: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return buildStockSalesReport(movements);
}
