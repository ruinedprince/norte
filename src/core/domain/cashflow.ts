// Cash-flow math (escopo Fase 1). Descriptive only — never a projection.

/**
 * Monthly savings rate as a ratio: (income − expense) / income. `expenseCents`
 * is a positive magnitude. Returns null when there is no income to measure
 * against; can be negative when spending exceeds income.
 */
export function savingsRate(
  incomeCents: number,
  expenseCents: number,
): number | null {
  if (incomeCents <= 0) return null;
  return (incomeCents - expenseCents) / incomeCents;
}

/**
 * Share of income that is passive (dividends) vs active: passive / (active +
 * passive). Returns null when there is no income. The project's north-star
 * question — "quanto da minha renda já vem de dividendos" (escopo §3).
 */
export function passiveShare(
  activeCents: number,
  passiveCents: number,
): number | null {
  const total = activeCents + passiveCents;
  return total > 0 ? passiveCents / total : null;
}
