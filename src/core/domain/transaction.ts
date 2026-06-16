// Shared domain vocabulary. SQLite has no native enums, so these union types are
// the single source of truth for the allowed string values used across the app
// (schema fields are plain String; values are validated here in the domain).

export type AccountType = "checking" | "savings" | "cash" | "brokerage";
export type TransactionType = "income" | "expense" | "transfer";
export type TransactionSource = "ofx" | "manual";
export type CategoryKind = "need" | "want" | "saving";

/**
 * Phase 0 derives the transaction type from the signed amount (escopo §4,
 * single-entry). Transfer detection needs a linked pair across accounts and is
 * left to a later slice, so a lone imported line is income or expense by sign.
 */
export function typeFromAmount(amountCents: number): "income" | "expense" {
  return amountCents < 0 ? "expense" : "income";
}
