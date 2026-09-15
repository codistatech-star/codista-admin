import type { CashEntrySource, CashEntryType } from "@prisma/client";

export type CashEntryRow = {
  id: string;
  type: CashEntryType;
  source: CashEntrySource;
  amount: number;
  category: string | null;
  description: string | null;
  entryDate: Date;
  accountId: string;
  accountName: string;
};

export type AccountMovement = {
  id: string;
  name: string;
  opening: number;
  income: number;
  expense: number;
  closing: number;
};

export type SourceBreakdown = {
  source: CashEntrySource;
  label: string;
  amount: number;
  href?: string;
};

export type CategoryBreakdown = {
  category: string;
  amount: number;
};

export type CashflowReport = {
  opening: number;
  income: number;
  expense: number;
  net: number;
  closing: number;
  prevIncome: number;
  prevExpense: number;
  prevNet: number;
  netDelta: number | null;
  netDeltaPct: number | null;
  incomeBySource: SourceBreakdown[];
  expenseByCategory: CategoryBreakdown[];
  accounts: AccountMovement[];
  entries: CashEntryRow[];
};

const SOURCE_LABELS: Record<CashEntrySource, string> = {
  MEMBERSHIP: "Membership fees",
  STOCK_SALE: "Stock sales",
  STOCK_PURCHASE: "Stock purchases",
  EVENT: "Events",
  MANUAL: "Manual",
  OTHER: "Other",
};

const PREFERRED_ACCOUNTS = ["Cash", "UPI", "Bank"];

function signedDelta(type: CashEntryType, amount: number) {
  return type === "INCOME" ? amount : -amount;
}

export function sourceLabel(source: CashEntrySource) {
  return SOURCE_LABELS[source] ?? source;
}

export function buildCashflowReport(input: {
  month: string;
  accounts: { id: string; name: string }[];
  /** All branch entries with entryDate < month end (used for opening/closing + month ledger). */
  entries: {
    id: string;
    type: CashEntryType;
    source: CashEntrySource;
    amount: { toString(): string } | number;
    category: string | null;
    description: string | null;
    entryDate: Date;
    accountId: string;
    account: { name: string };
  }[];
  monthStart: Date;
  monthEnd: Date;
  prevStart: Date;
}): CashflowReport {
  const rows: CashEntryRow[] = input.entries.map((e) => ({
    id: e.id,
    type: e.type,
    source: e.source,
    amount: Number(e.amount),
    category: e.category,
    description: e.description,
    entryDate: e.entryDate,
    accountId: e.accountId,
    accountName: e.account.name,
  }));

  const beforeMonth = rows.filter((e) => e.entryDate < input.monthStart);
  const inMonth = rows
    .filter((e) => e.entryDate >= input.monthStart && e.entryDate < input.monthEnd)
    .sort((a, b) => b.entryDate.getTime() - a.entryDate.getTime());
  const inPrev = rows.filter(
    (e) => e.entryDate >= input.prevStart && e.entryDate < input.monthStart,
  );

  const opening = beforeMonth.reduce((n, e) => n + signedDelta(e.type, e.amount), 0);
  const income = inMonth.filter((e) => e.type === "INCOME").reduce((n, e) => n + e.amount, 0);
  const expense = inMonth.filter((e) => e.type === "EXPENSE").reduce((n, e) => n + e.amount, 0);
  const net = income - expense;
  const closing = opening + net;

  const prevIncome = inPrev.filter((e) => e.type === "INCOME").reduce((n, e) => n + e.amount, 0);
  const prevExpense = inPrev.filter((e) => e.type === "EXPENSE").reduce((n, e) => n + e.amount, 0);
  const prevNet = prevIncome - prevExpense;
  const netDelta = net - prevNet;
  const netDeltaPct = prevNet !== 0 ? Math.round((netDelta / Math.abs(prevNet)) * 100) : null;

  const incomeSources: CashEntrySource[] = ["MEMBERSHIP", "STOCK_SALE", "EVENT", "MANUAL", "OTHER"];
  const incomeBySource: SourceBreakdown[] = incomeSources
    .map((source) => {
      const amount = inMonth
        .filter((e) => e.type === "INCOME" && e.source === source)
        .reduce((n, e) => n + e.amount, 0);
      let href: string | undefined;
      if (source === "MEMBERSHIP") href = `/admin/reports/payments?month=${input.month}`;
      if (source === "STOCK_SALE") href = `/admin/reports/stock?month=${input.month}`;
      return { source, label: sourceLabel(source), amount, href };
    })
    .filter((r) => r.amount > 0);

  const expenseMap = new Map<string, number>();
  for (const e of inMonth.filter((x) => x.type === "EXPENSE")) {
    const key = e.category?.trim() || "Expense";
    expenseMap.set(key, (expenseMap.get(key) ?? 0) + e.amount);
  }
  const expenseByCategory: CategoryBreakdown[] = [...expenseMap.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  const accountIds = new Set(input.accounts.map((a) => a.id));
  const movements = input.accounts.map((a) => {
    const relatedBefore = beforeMonth.filter((e) => e.accountId === a.id);
    const relatedMonth = inMonth.filter((e) => e.accountId === a.id);
    const openingBal = relatedBefore.reduce((n, e) => n + signedDelta(e.type, e.amount), 0);
    const inc = relatedMonth.filter((e) => e.type === "INCOME").reduce((n, e) => n + e.amount, 0);
    const exp = relatedMonth.filter((e) => e.type === "EXPENSE").reduce((n, e) => n + e.amount, 0);
    return {
      id: a.id,
      name: a.name,
      opening: openingBal,
      income: inc,
      expense: exp,
      closing: openingBal + inc - exp,
    };
  });

  const ordered: AccountMovement[] = [];
  for (const name of PREFERRED_ACCOUNTS) {
    const found = movements.find((m) => m.name.toLowerCase() === name.toLowerCase());
    if (found) ordered.push(found);
    else ordered.push({ id: name, name, opening: 0, income: 0, expense: 0, closing: 0 });
  }
  for (const m of movements) {
    if (!PREFERRED_ACCOUNTS.some((n) => n.toLowerCase() === m.name.toLowerCase())) {
      ordered.push(m);
    }
  }

  // Include orphan account ids that somehow have entries but no active account row
  const orphanIds = [...new Set(rows.map((e) => e.accountId))].filter((id) => !accountIds.has(id));
  for (const id of orphanIds) {
    const sample = rows.find((e) => e.accountId === id);
    const relatedBefore = beforeMonth.filter((e) => e.accountId === id);
    const relatedMonth = inMonth.filter((e) => e.accountId === id);
    const openingBal = relatedBefore.reduce((n, e) => n + signedDelta(e.type, e.amount), 0);
    const inc = relatedMonth.filter((e) => e.type === "INCOME").reduce((n, e) => n + e.amount, 0);
    const exp = relatedMonth.filter((e) => e.type === "EXPENSE").reduce((n, e) => n + e.amount, 0);
    ordered.push({
      id,
      name: sample?.accountName ?? "Unknown",
      opening: openingBal,
      income: inc,
      expense: exp,
      closing: openingBal + inc - exp,
    });
  }

  return {
    opening,
    income,
    expense,
    net,
    closing,
    prevIncome,
    prevExpense,
    prevNet,
    netDelta,
    netDeltaPct,
    incomeBySource,
    expenseByCategory,
    accounts: ordered,
    entries: inMonth,
  };
}
