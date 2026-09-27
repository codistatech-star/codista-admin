export type StockItemDTO = {
  id: string;
  name: string;
  sku: string | null;
  quantity: number;
  salePrice: number;
  costPrice: number;
  lowStockAt: number;
};

export type StockMemberOption = {
  id: string;
  code: string;
  name: string;
};

export function resolveItemUnitPrice(item: StockItemDTO, type: string): number | null {
  if (type === "PURCHASE") return item.costPrice;
  if (type === "SALE") return item.salePrice;
  return null;
}
