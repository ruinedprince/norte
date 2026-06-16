import { describe, expect, it } from "vitest";

import { buildDedupKey } from "./dedup";

const date = new Date(Date.UTC(2024, 0, 15, 12));

describe("buildDedupKey", () => {
  it("prefers the FITID when present", () => {
    expect(buildDedupKey({ fitid: "ABC123", date, amountCents: -5000 })).toBe(
      "fitid:ABC123",
    );
  });

  it("falls back to a normalized composite of day + amount + memo", () => {
    expect(
      buildDedupKey({ date, amountCents: -350, memo: "Café  da   manhã" }),
    ).toBe("composite:2024-01-15|-350|café da manhã");
  });

  it("treats a blank FITID as missing", () => {
    expect(buildDedupKey({ fitid: "   ", date, amountCents: 100 })).toBe(
      "composite:2024-01-15|100|",
    );
  });
});
