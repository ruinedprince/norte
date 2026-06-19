import { describe, expect, it } from "vitest";

import { linearTrendSlope, movingAverage } from "./trends";

describe("movingAverage", () => {
  it("is null until the window is full, then the trailing mean", () => {
    expect(movingAverage([10, 20, 30, 40], 1)).toEqual([10, 20, 30, 40]);
    expect(movingAverage([10, 20, 30, 40], 2)).toEqual([null, 15, 25, 35]);
    expect(movingAverage([3, 6, 9], 3)).toEqual([null, null, 6]);
  });

  it("handles the empty series and an oversized window", () => {
    expect(movingAverage([], 3)).toEqual([]);
    expect(movingAverage([5], 3)).toEqual([null]);
    expect(movingAverage([1, 2], 0)).toEqual([null, null]);
  });
});

describe("linearTrendSlope", () => {
  it("is the per-step slope by least squares", () => {
    expect(linearTrendSlope([0, 10, 20, 30])).toBeCloseTo(10, 10); // +10/step
    expect(linearTrendSlope([100, 90, 80])).toBeCloseTo(-10, 10); // declining
    expect(linearTrendSlope([5, 5, 5, 5])).toBe(0); // flat
  });

  it("fits the slope through noisy points", () => {
    // y ≈ 2x + 1 with small wobble → slope close to 2.
    expect(linearTrendSlope([1, 3, 5, 7, 9])).toBeCloseTo(2, 10);
  });

  it("is null with fewer than two points", () => {
    expect(linearTrendSlope([])).toBeNull();
    expect(linearTrendSlope([42])).toBeNull();
  });
});
