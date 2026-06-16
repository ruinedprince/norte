import type { AccountType } from "../domain/transaction";

/** One transaction as read from an external statement, before it touches the DB. */
export interface ParsedTransaction {
  date: Date;
  /** Signed integer cents: negative = money out, positive = money in. */
  amountCents: number;
  description: string;
  /** Raw external id from the source (OFX FITID), when present. */
  fitid?: string;
  /** Raw memo text, kept for the dedup fallback hash when no FITID exists. */
  memo?: string;
}

/** Account metadata read from a statement, used to find-or-create the Account. */
export interface ParsedAccount {
  /** Stable id derived from the source, e.g. "bankId:acctId". */
  externalId: string;
  type: AccountType;
  currency: string;
  name: string;
}

export interface ParsedStatement {
  account: ParsedAccount;
  transactions: ParsedTransaction[];
}

/**
 * Port for any statement source (OFX now; CSV / Pluggy later). The domain depends
 * on this interface, never on a concrete parser — an anti-corruption layer so a
 * new source can be added without touching the core (escopo §6).
 */
export interface ImportSource {
  /** Parse raw statement bytes into a neutral statement. */
  parse(content: Uint8Array): ParsedStatement;
}
