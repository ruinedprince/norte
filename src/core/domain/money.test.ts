import { describe, expect, it } from "vitest";

import { formatBRL, parseBRLToCents } from "./money";

// Currency formatting may use a non-breaking or narrow space before the value.
const norm = (s: string) => s.replace(/[  ]/g, " ");

describe("formatBRL", () => {
  it("formats integer cents as BRL", () => {
    expect(norm(formatBRL(123456))).toBe("R$ 1.234,56");
    expect(norm(formatBRL(0))).toBe("R$ 0,00");
    expect(norm(formatBRL(5))).toBe("R$ 0,05");
  });

  it("keeps the sign for negative amounts", () => {
    expect(norm(formatBRL(-5000))).toMatch(/-.*50,00/);
  });
});

describe("parseBRLToCents", () => {
  it("parses BRL strings into integer cents", () => {
    expect(parseBRLToCents("R$ 1.234,56")).toBe(123456);
    expect(parseBRLToCents("1234,56")).toBe(123456);
    expect(parseBRLToCents("-50,00")).toBe(-5000);
    expect(parseBRLToCents("0,99")).toBe(99);
  });

  it("round-trips with formatBRL", () => {
    for (const cents of [0, 5, 99, 10000, 123456, -5000]) {
      expect(parseBRLToCents(formatBRL(cents))).toBe(cents);
    }
  });
});
