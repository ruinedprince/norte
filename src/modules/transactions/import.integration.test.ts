import { readFileSync } from "node:fs";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { OfxImportSource } from "@/core/adapters/ofx/ofx-import-source";
import { prisma } from "@/lib/prisma";

import {
  getStats,
  listTransactions,
  monthlySpending,
  persistStatement,
} from "./repository";

// Exercises the full runtime path against the real dev.db: Prisma 7 driver
// adapter + better-sqlite3 + persist + dedup + aggregation. Touches only the
// sample account (by externalId), so any real data in the db is left intact.
const fixture = new Uint8Array(
  readFileSync("docs/samples/extrato-exemplo.ofx"),
);
const statement = new OfxImportSource().parse(fixture);

async function removeSampleAccount() {
  await prisma.account.deleteMany({
    where: { externalId: statement.account.externalId },
  });
}

beforeAll(removeSampleAccount);
afterAll(async () => {
  await removeSampleAccount();
  await prisma.$disconnect();
});

describe("OFX import pipeline (real SQLite via Prisma 7)", () => {
  it("imports a statement and is idempotent on re-import", async () => {
    const first = await persistStatement(statement);
    expect(first.imported).toBe(statement.transactions.length);
    expect(first.duplicates).toBe(0);
    expect(first.accountName).toContain("Banco Inter");

    const second = await persistStatement(statement);
    expect(second.imported).toBe(0);
    expect(second.duplicates).toBe(statement.transactions.length);
  });

  it("lists the imported rows and aggregates positive monthly spend", async () => {
    const rows = await listTransactions(100);
    const mine = rows.filter(
      (r) => r.account.externalId === statement.account.externalId,
    );
    expect(mine.length).toBe(statement.transactions.length);

    const stats = await getStats();
    expect(stats.accountCount).toBeGreaterThanOrEqual(1);

    const spend = await monthlySpending();
    expect(spend.length).toBeGreaterThan(0);
    for (const point of spend) {
      expect(Number.isInteger(point.spentCents)).toBe(true);
      expect(point.spentCents).toBeGreaterThan(0);
    }
    // Months come back sorted oldest-first.
    const keys = spend.map((p) => p.month);
    expect([...keys].sort()).toEqual(keys);
  });
});
