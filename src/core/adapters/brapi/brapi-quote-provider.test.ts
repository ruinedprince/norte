import { describe, expect, it } from "vitest";

import { mapBrapiResults } from "./brapi-quote-provider";

describe("mapBrapiResults", () => {
  it("maps reais prices to cents and uppercases tickers", () => {
    const quotes = mapBrapiResults({
      results: [
        { symbol: "MXRF11", regularMarketPrice: 9.85, regularMarketTime: "2024-01-15T18:00:00.000Z" },
        { symbol: "hglg11", regularMarketPrice: 160.5, regularMarketTime: "2024-01-15T18:00:00.000Z" },
      ],
    });
    expect(quotes).toHaveLength(2);
    expect(quotes[0]).toMatchObject({ ticker: "MXRF11", closeCents: 985 });
    expect(quotes[1]).toMatchObject({ ticker: "HGLG11", closeCents: 16050 });
  });

  it("skips malformed entries and tolerates empty/garbage input", () => {
    expect(
      mapBrapiResults({ results: [{ symbol: "X" }, { regularMarketPrice: 1 }] }),
    ).toEqual([]);
    expect(mapBrapiResults({})).toEqual([]);
    expect(mapBrapiResults(null)).toEqual([]);
  });
});
