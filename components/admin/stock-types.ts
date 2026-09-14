export type StockVariantDTO = {
  id: string;
  label: string;
  quantity: number;
  salePrice: number | null;
  costPrice: number | null;
};

export type StockItemDTO = {
  id: string;
  name: string;
  sku: string | null;
  salePrice: number;
  costPrice: number;
  lowStockAt: number;
  variants: StockVariantDTO[];
};

export type StockMemberOption = {
  id: string;
  code: string;
  name: string;
};

export function resolveVariantUnitPrice(
  item: StockItemDTO,
  variant: StockVariantDTO | undefined,
  type: string,
): number | null {
  if (!variant) return null;
  if (type === "PURCHASE") {
    return variant.costPrice ?? item.costPrice;
  }
  if (type === "SALE") {
    return variant.salePrice ?? item.salePrice;
  }
  return null;
}
