/** One market quote as read from a provider, before it touches the DB. */
export interface QuoteResult {
  ticker: string;
  closeCents: number;
  date: Date;
}

/**
 * Port for a market-quote source (brapi now). The app always reads quotes from
 * its own stored snapshots; a provider only populates them, best-effort — so the
 * app keeps working offline (escopo §6 anti-corruption layer).
 */
export interface QuoteProvider {
  /** Latest quote per ticker. May throw (no token, rate limit, offline). */
  getQuotes(tickers: string[]): Promise<QuoteResult[]>;
}
