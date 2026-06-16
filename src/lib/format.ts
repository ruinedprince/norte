// UI formatting helpers (Portuguese, per escopo: only the UI is in PT).
// Money formatting lives in the domain (core/domain/money.ts); these are the
// date/month helpers the views need.

const MONTHS_PT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

/** "2024-01" → "jan/24". Deterministic, independent of the runtime locale. */
export function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  return `${MONTHS_PT[Number(month) - 1]}/${year.slice(2)}`;
}

/**
 * Format a transaction date as "15 jan". Dates are stored at UTC noon, so we
 * read them in UTC to always show the intended calendar day (escopo §4).
 */
export function formatTxDate(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${day} ${MONTHS_PT[date.getUTCMonth()]}`;
}

/** Format a ratio as a rounded percentage, e.g. 0.324 → "32%", -0.2 → "-20%". */
export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

/** Cents → an editable amount string like "1234,56" (comma decimal, no symbol),
 *  round-trips with parseBRLToCents. */
export function centsToAmountInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}
