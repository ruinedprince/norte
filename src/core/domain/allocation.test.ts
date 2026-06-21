import { describe, expect, it } from "vitest";

import { allocationVsTarget } from "./allocation";

describe("allocationVsTarget", () => {
  it("compares current fractions to target percents (gap in pp)", () => {
    const rows = allocationVsTarget(
      [
        { key: "fii", fraction: 0.7 },
        { key: "stock", fraction: 0.3 },
      ],
      { fii: 60, stock: 30, etf: 10 },
    );
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r]));
    expect(byKey.fii.currentPct).toBeCloseTo(70, 6);
    expect(byKey.fii.targetPct).toBe(60);
    expect(byKey.fii.gapPp).toBeCloseTo(10, 6);
    expect(byKey.stock.gapPp).toBeCloseTo(0, 6);
    expect(byKey.etf.currentPct).toBe(0);
    expect(byKey.etf.gapPp).toBeCloseTo(-10, 6);
  });

  it("keeps holdings with no target and targets with no holding; drops empty keys", () => {
    const rows = allocationVsTarget([{ key: "stock", fraction: 1 }], { fii: 50 });
    const keys = rows.map((r) => r.key);
    expect(keys).toContain("stock"); // held but not in the plan
    expect(keys).toContain("fii"); // planned but not held
    expect(keys).not.toContain("etf");
    expect(rows.find((r) => r.key === "stock")?.gapPp).toBe(100);
  });
});
