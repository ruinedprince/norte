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
    await prisma.transaction.createMany({
      data: fresh.map(([dedupKey, tx]) => ({
        accountId: acct.id,
        date: tx.date,
        amountCents: tx.amountCents,
        type: typeFromAmount(tx.amountCents),
        description: tx.description,
        source: "ofx",
        externalId: tx.fitid ?? null,
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
