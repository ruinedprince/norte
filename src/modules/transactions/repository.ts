import { savingsRate } from "@/core/domain/cashflow";
import { pickCategoryId } from "@/core/domain/categorization";
import { buildDedupKey } from "@/core/domain/dedup";
import { typeFromAmount } from "@/core/domain/transaction";
import type { ParsedStatement } from "@/core/ports/import-source";
import { prisma } from "@/lib/prisma";

export interface ImportResult {
  accountName: string;
  total: number;
  imported: number;
  duplicates: number;
}

/**
 * Persist a parsed statement idempotently (escopo §6). Finds-or-creates the
 * account by its external id, then inserts only the transactions whose dedup
 * key is not already stored for that account. Re-importing the same file is a
 * no-op.
 */
export async function persistStatement(
  statement: ParsedStatement,
): Promise<ImportResult> {
  const { account, transactions } = statement;

  const acct = await prisma.account.upsert({
    where: { externalId: account.externalId },
    create: {
      name: account.name,
      type: account.type,
      currency: account.currency,
      externalId: account.externalId,
    },
    update: {}, // keep any later user edits to name/type on re-import
  });

  // Collapse duplicates within the same file (last occurrence wins).
  const byKey = new Map<string, { date: Date; amountCents: number; description: string; fitid?: string }>();
  for (const tx of transactions) {
    byKey.set(buildDedupKey(tx), tx);
  }

  const keys = [...byKey.keys()];
  const existing = await prisma.transaction.findMany({
    where: { accountId: acct.id, dedupKey: { in: keys } },
    select: { dedupKey: true },
  });
  const existingKeys = new Set(existing.map((e) => e.dedupKey));

  const fresh = [...byKey.entries()].filter(([key]) => !existingKeys.has(key));

  if (fresh.length > 0) {
    // Auto-categorize new rows by the user's rules at import time (escopo §3).
    const rules = await prisma.categorizationRule.findMany({
      select: { matcher: true, categoryId: true, priority: true },
    });
    await prisma.transaction.createMany({
      data: fresh.map(([dedupKey, tx]) => ({
        accountId: acct.id,
        date: tx.date,
        amountCents: tx.amountCents,
        type: typeFromAmount(tx.amountCents),
        description: tx.description,
        source: "ofx",
        externalId: tx.fitid ?? null,
        categoryId: pickCategoryId(tx.description, rules),
        dedupKey,
      })),
    });
  }

  return {
    accountName: acct.name,
    total: transactions.length,
    imported: fresh.length,
    duplicates: transactions.length - fresh.length,
  };
}

/** Most recent transactions, newest first, with their account and category. */
export async function listTransactions(limit = 200) {
  return prisma.transaction.findMany({
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: { account: true, category: true },
  });
}

/** All accounts, oldest first — for the manual-entry account picker. */
export function listAccounts() {
  return prisma.account.findMany({
    orderBy: [{ createdAt: "asc" }],
    select: { id: true, name: true, type: true },
  });
}

/** Find-or-create the default cash wallet manual entries land in by default. */
export function ensureDefaultCashAccount() {
  return prisma.account.upsert({
    where: { externalId: "manual:carteira" },
    create: {
      name: "Carteira",
      type: "cash",
      currency: "BRL",
      externalId: "manual:carteira",
    },
    update: {},
  });
}

/**
 * Create a manual transaction (escopo §4, source = manual). Each manual entry is
 * intentionally unique — a random dedupKey keeps two identical entries as
 * distinct rows. When no category is given, the rules still get a chance.
 */
export async function createManualTransaction(input: {
  accountId: string;
  date: Date;
  amountCents: number; // signed
  description: string;
  categoryId?: string | null;
}) {
  let categoryId = input.categoryId ?? null;
  if (!categoryId && input.description) {
    const rules = await prisma.categorizationRule.findMany({
      select: { matcher: true, categoryId: true, priority: true },
    });
    categoryId = pickCategoryId(input.description, rules);
  }

  return prisma.transaction.create({
    data: {
      accountId: input.accountId,
      date: input.date,
      amountCents: input.amountCents,
      type: typeFromAmount(input.amountCents),
      description: input.description,
      source: "manual",
      dedupKey: `manual:${crypto.randomUUID()}`,
      categoryId,
    },
  });
}

export interface MonthlySpendingPoint {
  /** Sortable "YYYY-MM" key, computed from the UTC date. */
  month: string;
  /** Total spent that month in positive cents. */
  spentCents: number;
}

/**
 * Spend per month: sum of money-out (negative) transactions, returned as
 * positive cents per "YYYY-MM" bucket, oldest first. Aggregated in JS — fine
 * for a personal dataset (YAGNI; measure before optimizing, escopo §1).
 */
export async function monthlySpending(): Promise<MonthlySpendingPoint[]> {
  const rows = await prisma.transaction.findMany({
    where: { amountCents: { lt: 0 } },
    select: { date: true, amountCents: true },
  });

  const byMonth = new Map<string, number>();
  for (const row of rows) {
    const key = monthKey(row.date);
    byMonth.set(key, (byMonth.get(key) ?? 0) + Math.abs(row.amountCents));
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, spentCents]) => ({ month, spentCents }));
}

export interface CashFlowPoint {
  month: string;
  incomeCents: number;
  expenseCents: number;
  netCents: number;
  savingsRate: number | null;
}

/**
 * Receita × despesa por mês + savings rate (escopo Fase 1). Income is the sum of
 * money-in, expense the magnitude of money-out, per "YYYY-MM" bucket, oldest
 * first. Type is sign-based; transfers between own accounts would show on both
 * sides — transfer pairing is a later slice.
 */
export async function monthlyCashFlow(): Promise<CashFlowPoint[]> {
  const rows = await prisma.transaction.findMany({
    select: { date: true, amountCents: true },
  });

  const byMonth = new Map<string, { income: number; expense: number }>();
  for (const row of rows) {
    const key = monthKey(row.date);
    const bucket = byMonth.get(key) ?? { income: 0, expense: 0 };
    if (row.amountCents >= 0) bucket.income += row.amountCents;
    else bucket.expense += Math.abs(row.amountCents);
    byMonth.set(key, bucket);
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { income, expense }]) => ({
      month,
      incomeCents: income,
      expenseCents: expense,
      netCents: income - expense,
      savingsRate: savingsRate(income, expense),
    }));
}

export interface CategorySpendPoint {
  categoryId: string | null;
  /** null for the uncategorized bucket; the UI labels it. */
  name: string | null;
  kind: string | null;
  spentCents: number;
}

/**
 * Spend grouped by category (money-out only), positive cents, biggest first.
 * Uncategorized transactions collapse into a single null-named bucket. JS-side
 * aggregation — fine for a personal dataset (escopo §1).
 */
export async function spendByCategory(): Promise<CategorySpendPoint[]> {
  const rows = await prisma.transaction.findMany({
    where: { amountCents: { lt: 0 } },
    select: {
      amountCents: true,
      category: { select: { id: true, name: true, kind: true } },
    },
  });

  const byCategory = new Map<string, CategorySpendPoint>();
  for (const row of rows) {
    const key = row.category?.id ?? "__none__";
    const existing = byCategory.get(key);
    if (existing) {
      existing.spentCents += Math.abs(row.amountCents);
    } else {
      byCategory.set(key, {
        categoryId: row.category?.id ?? null,
        name: row.category?.name ?? null,
        kind: row.category?.kind ?? null,
        spentCents: Math.abs(row.amountCents),
      });
    }
  }

  return [...byCategory.values()].sort((a, b) => b.spentCents - a.spentCents);
}

/** Lightweight counters for the dashboard. */
export async function getStats(): Promise<{ txCount: number; accountCount: number }> {
  const [txCount, accountCount] = await Promise.all([
    prisma.transaction.count(),
    prisma.account.count(),
  ]);
  return { txCount, accountCount };
}

function monthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
