// Money is always stored as an integer number of cents (centavos).
// Never use floats for money — formatting and parsing live here so the rest
// of the app never touches the cents <-> display conversion by hand.

export type Cents = number;

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Format an integer amount of cents as BRL, e.g. 18743000 -> "R$ 187.430,00". */
export function formatBRL(cents: Cents): string {
  return BRL.format(cents / 100);
}

const BRL_COMPACT = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Compact BRL for chart axis ticks, e.g. 123456 -> "R$ 1,2 mil". */
export function formatCompactBRL(cents: Cents): string {
  return BRL_COMPACT.format(cents / 100);
}

/** Parse a "R$ 1.234,56" / "1234,56" / "-50,00" string into integer cents. */
export function parseBRLToCents(input: string): Cents {
  const normalized = input
    .replace(/[^\d,-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  return Math.round(Number(normalized) * 100);
}

export type EntryDirection = "income" | "expense";

/**
 * Build signed integer cents from a BRL input and a direction: expenses are
 * stored negative, income positive (escopo §4 single-entry). The input's own
 * sign is ignored — the direction is the source of truth.
 */
export function parseSignedCents(input: string, direction: EntryDirection): Cents {
  const magnitude = Math.abs(parseBRLToCents(input));
  return direction === "expense" ? -magnitude : magnitude;
}
