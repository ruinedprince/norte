import { describe, expect, it } from "vitest";

import { derivePosition } from "./position";

const d = (iso: string) => new Date(`${iso}T12:00:00Z`);

describe("derivePosition", () => {
  it("computes weighted average cost across buys", () => {
    expect(
      derivePosition([
        { kind: "buy", quantity: 10, unitPriceCents: 1000, date: d("2024-01-01") },
        { kind: "buy", quantity: 10, unitPriceCents: 1200, date: d("2024-02-01") },
      ]),
    ).toEqual({ quantity: 20, avgCostCents: 1100, investedCents: 22000 });
  });

  it("sells reduce quantity at the running average cost", () => {
    expect(
      derivePosition([
        { kind: "buy", quantity: 20, unitPriceCents: 1100, date: d("2024-01-01") },
        { kind: "sell", quantity: 5, unitPriceCents: 1500, date: d("2024-03-01") },
      ]),
    ).toEqual({ quantity: 15, avgCostCents: 1100, investedCents: 16500 });
  });

  it("processes chronologically regardless of input order", () => {
    expect(
      derivePosition([
        { kind: "buy", quantity: 10, unitPriceCents: 1200, date: d("2024-02-01") },
        { kind: "buy", quantity: 10, unitPriceCents: 1000, date: d("2024-01-01") },
      ]).avgCostCents,
    ).toBe(1100);
  });

  it("zeroes out when fully sold (and clamps overselling)", () => {
    expect(
      derivePosition([
        { kind: "buy", quantity: 10, unitPriceCents: 1000, date: d("2024-01-01") },
        { kind: "sell", quantity: 15, unitPriceCents: 2000, date: d("2024-02-01") },
      ]),
    ).toEqual({ quantity: 0, avgCostCents: 0, investedCents: 0 });
  });
});
