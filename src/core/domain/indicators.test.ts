import { describe, expect, it } from "vitest";

import { priceToBook, trailingDividendYield } from "./indicators";

describe("priceToBook (P/VP)", () => {
  it("is price / book value per share", () => {
    expect(priceToBook(1000, 1000)).toBe(1); // at book value
    expect(priceToBook(900, 1000)).toBeCloseTo(0.9, 10); // below book
    expect(priceToBook(1150, 1000)).toBeCloseTo(1.15, 10); // above book
  });

  it("is null when either input is missing or non-positive", () => {
    expect(priceToBook(null, 1000)).toBeNull();
    expect(priceToBook(1000, null)).toBeNull();
    expect(priceToBook(0, 1000)).toBeNull();
    expect(priceToBook(1000, 0)).toBeNull();
    expect(priceToBook(-100, 1000)).toBeNull();
  });
});

describe("trailingDividendYield", () => {
  it("is per-share dividends / price", () => {
    expect(trailingDividendYield(80, 1000)).toBeCloseTo(0.08, 10); // 8%
    expect(trailingDividendYield(120, 980)).toBeCloseTo(0.12245, 4);
  });

  it("is 0 when nothing was paid, null with no usable price", () => {
    expect(trailingDividendYield(0, 1000)).toBe(0);
    expect(trailingDividendYield(80, null)).toBeNull();
    expect(trailingDividendYield(80, 0)).toBeNull();
    expect(trailingDividendYield(80, -10)).toBeNull();
  });
});
