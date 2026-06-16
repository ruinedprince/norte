import { describe, expect, it } from "vitest";

import { maxDrawdown, netWorthChange, netWorthSeries } from "./networth";

const d = (iso: string) => new Date(`${iso}T12:00:00Z`);

const series = netWorthSeries({
  accounts: [{ openingBalanceCents: 100000 }],
  cashTxns: [
    { date: d("2024-01-10"), amountCents: 50000 },
    { date: d("2024-02-05"), amountCents: -20000 },
  ],
  investmentTxns: [
    { assetId: "a1", date: d("2024-01-15"), kind: "buy", quantity: 10, unitPriceCents: 1000 },
  ],
  quotes: [{ assetId: "a1", date: d("2024-02-01"), closeCents: 1200 }],
  months: ["2024-01", "2024-02"],
});

describe("netWorthSeries", () => {
  it("values cash so far + investments at the latest quote (cost before any quote)", () => {
    // Jan: cash 100000 + 50000 = 150000; no quote yet → position at cost 10000.
    expect(series[0]).toEqual({
      month: "2024-01",
      cashCents: 150000,
      investmentsCents: 10000,
      netWorthCents: 160000,
    });
    // Feb: cash 130000; position 10 × 1200 = 12000.
    expect(series[1]).toEqual({
      month: "2024-02",
      cashCents: 130000,
      investmentsCents: 12000,
      netWorthCents: 142000,
    });
  });
});

describe("netWorthChange / maxDrawdown", () => {
  it("measures the recent change and the worst decline", () => {
    expect(netWorthChange(series, 1)).toBe(142000 - 160000);
    // peak 160000 → trough 142000 ⇒ drawdown 18000/160000 = 0.1125
    expect(maxDrawdown(series)).toBeCloseTo(0.1125, 5);
  });
});
