// Per-asset indicators (escopo Fase 2 [Could]: P/VP e indicadores de FII).
// Descriptive only — these are facts about a price, never a buy/sell signal
// (escopo §3 forbids any investment recommendation). Pure and framework-agnostic.

/**
 * Price-to-book (P/VP): current price over book value per share (VPA). Both
 * inputs are integer cents. Returns null when either is missing or non-positive
 * — there is no meaningful ratio to show. A value below 1 means the price is
 * under book value, above 1 means over; the UI states that as a fact, not advice.
 */
export function priceToBook(
  priceCents: number | null,
  bookValuePerShareCents: number | null,
): number | null {
  if (priceCents == null || bookValuePerShareCents == null) return null;
  if (priceCents <= 0 || bookValuePerShareCents <= 0) return null;
  return priceCents / bookValuePerShareCents;
}

/**
 * Trailing dividend yield for a single asset, as a ratio: per-share dividends
 * received over a window divided by the current price. `perShareCents` is the
 * already-summed per-share total for the window (a positive magnitude). Returns
 * null when there is no price to measure against, and 0 when nothing was paid.
 */
export function trailingDividendYield(
  perShareCents: number,
  priceCents: number | null,
): number | null {
  if (priceCents == null || priceCents <= 0) return null;
  if (perShareCents <= 0) return 0;
  return perShareCents / priceCents;
}
