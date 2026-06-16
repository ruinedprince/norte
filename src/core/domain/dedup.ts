/**
 * Idempotency key for an imported transaction, unique within its account
 * (escopo §6 dedup rule). Prefer the source FITID; fall back to a composite of
 * (date + amount + memo) when the FITID is missing or duplicated. Two distinct
 * lines that share day + amount + memo and have no FITID will collapse to one —
 * an accepted limitation of FITID-less dedup.
 */
export function buildDedupKey(tx: {
  fitid?: string;
  date: Date;
  amountCents: number;
  memo?: string;
}): string {
  const fitid = tx.fitid?.trim();
  if (fitid) {
    return `fitid:${fitid}`;
  }
  const day = tx.date.toISOString().slice(0, 10); // YYYY-MM-DD (dates stored at UTC noon)
  const memo = (tx.memo ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  return `composite:${day}|${tx.amountCents}|${memo}`;
}
