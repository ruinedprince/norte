import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { parseCsv } from "@/core/adapters/csv/csv-parser";
import { prisma } from "@/lib/prisma";

import { listTransactions, persistCsvTransactions } from "./repository";

const ACCOUNT = "__csv_test__";
const CSV = [
  "Data;Histórico;Valor",
  "15/01/2026;Mercado;-50,00",
  "16/01/2026;Salário;1.234,56",
].join("\n");

async function cleanup() {
  await prisma.account.deleteMany({ where: { name: ACCOUNT } });
}

beforeAll(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("CSV import (real SQLite via Prisma 7)", () => {
  it("persists into the chosen account and is idempotent on re-import", async () => {
    const account = await prisma.account.create({
      data: { name: ACCOUNT, type: "checking", currency: "BRL" },
    });
    const txns = parseCsv(CSV);
    expect(txns).toHaveLength(2);

    const first = await persistCsvTransactions(account.id, txns);
    expect(first).toMatchObject({ total: 2, imported: 2, duplicates: 0, accountName: ACCOUNT });

    // Re-importing the same file adds nothing (composite-key dedup).
    const second = await persistCsvTransactions(account.id, parseCsv(CSV));
    expect(second).toMatchObject({ total: 2, imported: 0, duplicates: 2 });

    const rows = (await listTransactions(500)).filter((t) => t.accountId === account.id);
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.source === "csv")).toBe(true);
    expect(rows.map((r) => r.amountCents).sort((a, b) => a - b)).toEqual([-5000, 123456]);
  });
});
