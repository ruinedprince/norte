import { describe, expect, it } from "vitest";

import { parseCsv } from "./csv-parser";

describe("parseCsv", () => {
  it("reads a semicolon Brazilian statement (signed, comma decimal)", () => {
    const csv = [
      "Data;Histórico;Valor",
      "15/01/2026;Mercado;-50,00",
      "16/01/2026;Salário;1.234,56",
    ].join("\n");

    const txns = parseCsv(csv);
    expect(txns).toHaveLength(2);
    expect(txns[0]).toMatchObject({ amountCents: -5000, description: "Mercado" });
    expect(txns[0].date.toISOString().slice(0, 10)).toBe("2026-01-15");
    expect(txns[1].amountCents).toBe(123456); // money in stays positive
  });

  it("handles a comma-delimited file (dot decimal) with a quoted field", () => {
    const csv = ["date,description,amount", '2026-02-01,"Posto, Shell",-80.50'].join("\n");

    const txns = parseCsv(csv);
    expect(txns).toHaveLength(1);
    expect(txns[0].description).toBe("Posto, Shell"); // comma inside quotes kept
    expect(txns[0].amountCents).toBe(-8050);
  });

  it("finds columns by accented / alternate header names, ignoring order", () => {
    const csv = [
      "Descrição;Valor (R$);Data Lançamento",
      "Uber;-19,90;03/03/2026",
    ].join("\n");

    const [tx] = parseCsv(csv);
    expect(tx.description).toBe("Uber");
    expect(tx.amountCents).toBe(-1990);
    expect(tx.date.toISOString().slice(0, 10)).toBe("2026-03-03");
  });

  it("skips blank, total and unparseable rows", () => {
    const csv = [
      "Data;Histórico;Valor",
      "",
      "10/01/2026;Café;-9,90",
      "Total;;-9,90", // no valid date → skipped
      "sem-data;Ruído;abc", // bad date and amount → skipped
    ].join("\n");

    const txns = parseCsv(csv);
    expect(txns).toHaveLength(1);
    expect(txns[0].description).toBe("Café");
  });

  it("throws when the date/amount columns are absent", () => {
    expect(() => parseCsv("foo;bar;baz\n1;2;3")).toThrow(/não reconhecido/i);
  });
});
