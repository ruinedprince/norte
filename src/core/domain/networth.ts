// Net worth over time (escopo Fase 3, descriptive — never a projection).
// Net worth at the end of a month = cash (accounts' opening balances + all cash
// transactions so far) + investments (each position valued at the latest quote
// on or before that month, falling back to cost basis when no quote exists).

import { derivePosition } from "./position";

export interface AccountSeed {
  openingBalanceCents: number;
}
export interface CashTx {
  date: Date;
  amountCents: number;
}
export interface InvTx {
  assetId: string;
  date: Date;
  kind: "buy" | "sell";
  quantity: number;
  unitPriceCents: number;
}
export interface QuotePoint {
  assetId: string;
  date: Date;
  closeCents: number;
}
export interface NetWorthPoint {
  month: string;
  cashCents: number;
  investmentsCents: number;
  netWorthCents: number;
}

function groupByAsset<T extends { assetId: string }>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const arr = map.get(item.assetId);
    if (arr) arr.push(item);
    else map.set(item.assetId, [item]);
  }
  return map;
}

export function netWorthSeries(input: {
  accounts: AccountSeed[];
  cashTxns: CashTx[];
  investmentTxns: InvTx[];
  quotes: QuotePoint[];
  months: string[]; // ascending "YYYY-MM"
}): NetWorthPoint[] {
  const openingTotal = input.accounts.reduce((sum, a) => sum + a.openingBalanceCents, 0);
  const txnsByAsset = groupByAsset(input.investmentTxns);
  const quotesByAsset = groupByAsset(input.quotes);
  for (const list of quotesByAsset.values()) {
    list.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  return input.months.map((month) => {
    const [year, m] = month.split("-").map(Number);
    const endExclusive = Date.UTC(year, m, 1); // first day of the following month

    const cashCents =
      openingTotal +
      input.cashTxns
        .filter((t) => t.date.getTime() < endExclusive)
        .reduce((sum, t) => sum + t.amountCents, 0);

    let investmentsCents = 0;
    for (const [assetId, txns] of txnsByAsset) {
      const position = derivePosition(
        txns.filter((t) => t.date.getTime() < endExclusive),
      );
      if (position.quantity <= 0) continue;
      const quotes = (quotesByAsset.get(assetId) ?? []).filter(
        (q) => q.date.getTime() < endExclusive,
      );
      const latest = quotes.at(-1);
      investmentsCents += latest
        ? position.quantity * latest.closeCents
        : position.investedCents;
    }

    return {
      month,
      cashCents,
      investmentsCents,
      netWorthCents: cashCents + investmentsCents,
    };
  });
}

/** Net-worth change (cents) over the last `months` points; null if too short. */
export function netWorthChange(series: NetWorthPoint[], months: number): number | null {
  if (series.length < 2) return null;
  const latest = series[series.length - 1].netWorthCents;
  const pastIndex = Math.max(0, series.length - 1 - months);
  return latest - series[pastIndex].netWorthCents;
}

/** Largest peak-to-trough decline of net worth as a ratio 0..1 (descriptive). */
export function maxDrawdown(series: NetWorthPoint[]): number {
  let peak = 0;
  let maxDd = 0;
  for (const point of series) {
    peak = Math.max(peak, point.netWorthCents);
    if (peak > 0) {
      maxDd = Math.max(maxDd, (peak - point.netWorthCents) / peak);
    }
  }
  return maxDd;
}
