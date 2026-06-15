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

/** Parse a "R$ 1.234,56" / "1234,56" / "-50,00" string into integer cents. */
export function parseBRLToCents(input: string): Cents {
  const normalized = input
    .replace(/[^\d,-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  return Math.round(Number(normalized) * 100);
}
