import { savingsRate } from "@/core/domain/cashflow";
import { pickCategoryId } from "@/core/domain/categorization";
import { buildDedupKey } from "@/core/domain/dedup";
import { typeFromAmount } from "@/core/domain/transaction";
import type { ParsedStatement, ParsedTransaction } from "@/core/ports/import-source";
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

/**
 * Persist CSV transactions into a user-chosen account (escopo §6 CSV fallback).
 * A CSV has no account id and no FITID, so the target account is passed in and
 * dedup falls back to the composite (date+amount+memo) hash — re-importing the
 * same file is a no-op. New rows are auto-categorized by the user's rules, same
 * as OFX.
 */
export async function persistCsvTransactions(
  accountId: string,
  transactions: ParsedTransaction[],
): Promise<ImportResult> {
  const acct = await prisma.account.findUnique({ where: { id: accountId } });
  if (!acct) throw new Error("Conta de destino não encontrada.");

  const byKey = new Map<string, ParsedTransaction>();
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
        source: "csv",
        externalId: null,
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

/** Most recent transactions, newest first, with their account, category and
 *  tags. When `tagId` is given, only transactions carrying that tag are returned. */
export async function listTransactions(limit = 200, tagId?: string) {
  return prisma.transaction.findMany({
    where: tagId ? { tags: { some: { tagId } } } : undefined,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: {
      account: true,
      category: true,
      tags: { include: { tag: true } },
    },
  });
}

/** All tags, alphabetical, with how many transactions carry each. */
export function listTags() {
  return prisma.tag.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, _count: { select: { transactions: true } } },
  });
}

/** Create a tag, idempotent on its unique name. */
export function createTag(name: string) {
  return prisma.tag.upsert({ where: { name }, create: { name }, update: {} });
}

/** Delete a tag; its transaction links cascade away. */
export function deleteTag(id: string) {
  return prisma.tag.delete({ where: { id } });
}

/** Attach a tag to a transaction (idempotent on the pair). */
export function addTransactionTag(transactionId: string, tagId: string) {
  return prisma.transactionTag.upsert({
    where: { transactionId_tagId: { transactionId, tagId } },
    create: { transactionId, tagId },
    update: {},
  });
}

/** Detach a tag from a transaction. */
export function removeTransactionTag(transactionId: string, tagId: string) {
  return prisma.transactionTag.delete({
    where: { transactionId_tagId: { transactionId, tagId } },
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
    where: { amountCents: { lt: 0 }, type: { not: "transfer" } },
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
 * first. Transfers (e.g. an aporte's cash leg) are excluded — they are neither
 * income nor expense (escopo §4).
 */
export async function monthlyCashFlow(): Promise<CashFlowPoint[]> {
  const rows = await prisma.transaction.findMany({
    where: { type: { not: "transfer" } },
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

export interface BudgetSplit {
  month: string;
  incomeCents: number;
  needsCents: number;
  wantsCents: number;
  /** income − total expense (net). */
  savedCents: number;
}

/**
 * 50/30/20 split for the most recent month (escopo Fase 1 [Could]): how much of
 * the income went to need-kind vs want-kind categories, and how much was saved
 * (net). Descriptive — uncategorized spend is simply not counted as need/want.
 */
export async function latestMonthBudgetSplit(): Promise<BudgetSplit | null> {
  const flows = await monthlyCashFlow();
  const latest = flows.at(-1);
  if (!latest) return null;

  const [year, month] = latest.month.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  const rows = await prisma.transaction.findMany({
    where: { amountCents: { lt: 0 }, type: { not: "transfer" }, date: { gte: start, lt: end } },
    select: { amountCents: true, category: { select: { kind: true } } },
  });

  let needsCents = 0;
  let wantsCents = 0;
  for (const row of rows) {
    const amount = Math.abs(row.amountCents);
    if (row.category?.kind === "need") needsCents += amount;
    else if (row.category?.kind === "want") wantsCents += amount;
  }

  return {
    month: latest.month,
    incomeCents: latest.incomeCents,
    needsCents,
    wantsCents,
    savedCents: latest.netCents,
  };
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
    where: { amountCents: { lt: 0 }, type: { not: "transfer" } },
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
