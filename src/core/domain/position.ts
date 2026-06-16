// Investment position math (escopo Fase 2). A position is always DERIVED from
// the asset's buy/sell transactions, never stored. Pure and framework-agnostic.

export type AssetKind = "fii" | "stock" | "etf";
export type InvestmentKind = "buy" | "sell";

export interface InvestmentTxLike {
  kind: InvestmentKind;
  quantity: number; // whole shares
  unitPriceCents: number;
  date: Date;
}

export interface Position {
  quantity: number;
  /** Weighted average cost per share, in cents. */
  avgCostCents: number;
  /** Cost basis of the current holdings, in cents. */
  investedCents: number;
}

/**
 * Derive the current position using weighted-average cost. Transactions are
 * processed chronologically: buys add to quantity and cost; sells remove
 * quantity at the running average cost (so realized gains don't change the
 * remaining cost basis). Overselling is clamped to the held quantity.
 */
export function derivePosition(txns: InvestmentTxLike[]): Position {
  const sorted = [...txns].sort((a, b) => a.date.getTime() - b.date.getTime());

  let quantity = 0;
  let investedCents = 0;
  for (const tx of sorted) {
    if (tx.kind === "buy") {
      quantity += tx.quantity;
      investedCents += tx.quantity * tx.unitPriceCents;
    } else {
      const sellQty = Math.min(tx.quantity, quantity);
      const avg = quantity > 0 ? investedCents / quantity : 0;
      investedCents -= Math.round(avg * sellQty);
      quantity -= sellQty;
    }
  }

  if (quantity <= 0) {
    return { quantity: 0, avgCostCents: 0, investedCents: 0 };
  }
  return { quantity, avgCostCents: Math.round(investedCents / quantity), investedCents };
}
