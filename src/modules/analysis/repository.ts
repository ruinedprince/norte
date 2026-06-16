import {
  maxDrawdown,
  netWorthChange,
  netWorthSeries,
  type InvTx,
  type NetWorthPoint,
} from "@/core/domain/networth";
import { prisma } from "@/lib/prisma";

/** Months from the earliest activity through the current month, capped to the
 *  last 24 for a readable chart. */
function buildMonthRange(dates: Date[]): string[] {
  if (dates.length === 0) return [];
  const min = new Date(Math.min(...dates.map((d) => d.getTime())));
  const now = new Date();
  const endYear = now.getUTCFullYear();
  const endMonth = now.getUTCMonth();

  const months: string[] = [];
  let year = min.getUTCFullYear();
  let month = min.getUTCMonth();
  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(`${year}-${String(month + 1).padStart(2, "0")}`);
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return months.slice(-24);
}

export interface NetWorthAnalysis {
  series: NetWorthPoint[];
  currentCents: number;
  change3mCents: number | null;
  drawdown: number;
}

/** Net worth over time + simple trends (escopo Fase 3). */
export async function netWorthAnalysis(): Promise<NetWorthAnalysis> {
  const [accounts, transactions, investmentTxns, quotes] = await Promise.all([
    prisma.account.findMany({ select: { openingBalanceCents: true } }),
    prisma.transaction.findMany({ select: { date: true, amountCents: true } }),
    prisma.investmentTransaction.findMany({
      select: { assetId: true, date: true, kind: true, quantity: true, unitPriceCents: true },
    }),
    prisma.quote.findMany({ select: { assetId: true, date: true, closeCents: true } }),
  ]);

  const months = buildMonthRange([
    ...transactions.map((t) => t.date),
    ...investmentTxns.map((t) => t.date),
  ]);

  const series = netWorthSeries({
    accounts,
    cashTxns: transactions,
    investmentTxns: investmentTxns.map((t) => ({ ...t, kind: t.kind as InvTx["kind"] })),
    quotes,
    months,
  });

  return {
    series,
    currentCents: series.at(-1)?.netWorthCents ?? 0,
    change3mCents: netWorthChange(series, 3),
    drawdown: maxDrawdown(series),
  };
}
