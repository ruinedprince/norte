import { describe, expect, it } from "vitest";

import { evaluateRules, type MetricSnapshot, type RuleLike } from "./rules";

const snapshot: MetricSnapshot = {
  savingsRate: 0.15,
  portfolioDY: 0.09,
  monthlySpend: 200000,
  netWorthChange3m: -50000,
};

const rule = (over: Partial<RuleLike>): RuleLike => ({
  id: "r",
  name: "r",
  metric: "savingsRate",
  comparator: "below",
  threshold: 0.2,
  enabled: true,
  ...over,
});

describe("evaluateRules", () => {
  it("triggers when a 'below' metric is under the threshold", () => {
    // savings rate 0.15 < 0.2 → triggered
    expect(evaluateRules([rule({})], snapshot)[0].triggered).toBe(true);
    // DY 0.09 is not < 0.08 → not triggered
    expect(
      evaluateRules([rule({ metric: "portfolioDY", threshold: 0.08 })], snapshot)[0]
        .triggered,
    ).toBe(false);
  });

  it("triggers when an 'above' metric exceeds the threshold", () => {
    // spend 200000 > 150000 → triggered
    expect(
      evaluateRules(
        [rule({ metric: "monthlySpend", comparator: "above", threshold: 150000 })],
        snapshot,
      )[0].triggered,
    ).toBe(true);
    // net worth change -50000 < 0 → triggered (below 0)
    expect(
      evaluateRules(
        [rule({ metric: "netWorthChange3m", comparator: "below", threshold: 0 })],
        snapshot,
      )[0].triggered,
    ).toBe(true);
  });

  it("skips disabled rules and never triggers on a null metric", () => {
    expect(evaluateRules([rule({ enabled: false })], snapshot)).toHaveLength(0);
    expect(
      evaluateRules([rule({ metric: "savingsRate", threshold: 0.2 })], {
        ...snapshot,
        savingsRate: null,
      })[0].triggered,
    ).toBe(false);
  });
});
