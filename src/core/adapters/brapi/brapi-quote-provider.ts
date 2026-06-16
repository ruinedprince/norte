import type { QuoteProvider, QuoteResult } from "../../ports/quote-provider";

interface BrapiResult {
  symbol?: string;
  regularMarketPrice?: number;
  regularMarketTime?: string | number;
}

interface BrapiResponse {
  results?: BrapiResult[];
}

/** Map a brapi `/api/quote` response into neutral QuoteResults. Pure + testable;
 *  malformed entries are skipped. Prices come in reais → rounded to cents. */
export function mapBrapiResults(data: unknown): QuoteResult[] {
  const response = (data ?? {}) as BrapiResponse;
  const results = Array.isArray(response.results) ? response.results : [];

  const quotes: QuoteResult[] = [];
  for (const result of results) {
    if (!result.symbol || typeof result.regularMarketPrice !== "number") continue;
    quotes.push({
      ticker: result.symbol.toUpperCase(),
      closeCents: Math.round(result.regularMarketPrice * 100),
      date: parseBrapiTime(result.regularMarketTime),
    });
  }
  return quotes;
}

function parseBrapiTime(time: string | number | undefined): Date {
  if (typeof time === "number") return new Date(time * 1000); // epoch seconds
  if (typeof time === "string") {
    const parsed = new Date(time);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

/**
 * brapi implementation of QuoteProvider. The token lives in `.env.local`
 * (BRAPI_TOKEN); without it, a clear error is thrown and the app falls back to
 * the last stored quotes. A free token is required for FIIs (escopo §6).
 */
export class BrapiQuoteProvider implements QuoteProvider {
  private readonly token: string | undefined;

  constructor(token: string | undefined = process.env.BRAPI_TOKEN) {
    this.token = token;
  }

  async getQuotes(tickers: string[]): Promise<QuoteResult[]> {
    if (tickers.length === 0) return [];
    if (!this.token) {
      throw new Error("Configure BRAPI_TOKEN no .env.local para sincronizar cotações.");
    }

    const list = encodeURIComponent(tickers.join(","));
    const res = await fetch(
      `https://brapi.dev/api/quote/${list}?token=${encodeURIComponent(this.token)}`,
    );
    if (!res.ok) {
      throw new Error(
        res.status === 402
          ? "Limite de requisições da brapi atingido (402)."
          : `brapi respondeu ${res.status}.`,
      );
    }
    return mapBrapiResults(await res.json());
  }
}
