import { describe, expect, it } from "vitest";

import { savingsRate } from "./cashflow";

describe("savingsRate", () => {
  it("computes (income - expense) / income", () => {
    expect(savingsRate(100000, 70000)).toBeCloseTo(0.3, 10);
    expect(savingsRate(450000, 185290)).toBeCloseTo(0.58824, 4);
  });

  it("is negative when spending exceeds income", () => {
    expect(savingsRate(100000, 120000)).toBeCloseTo(-0.2, 10);
  });

  it("is 1 with no expense, and null with no income", () => {
    expect(savingsRate(100000, 0)).toBe(1);
    expect(savingsRate(0, 5000)).toBeNull();
    expect(savingsRate(-100, 50)).toBeNull();
  });
});
