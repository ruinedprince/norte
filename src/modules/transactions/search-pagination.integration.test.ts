import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";

import { createManualTransaction, listTransactionsPage } from "./repository";

const ACCOUNT = "__search_test__";
const TOKEN = "ZZQRYTOKEN"; // unique so the query isolates this test's rows

async function cleanup() {
  await prisma.account.deleteMany({ where: { name: ACCOUNT } });
}

beforeAll(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("listTransactionsPage (real SQLite via Prisma 7)", () => {
  it("searches by description (case-insensitive) and paginates", async () => {
    const account = await prisma.account.create({
      data: { name: ACCOUNT, type: "cash", currency: "BRL" },
    });
    const mk = (description: string, day: number) =>
      createManualTransaction({
        accountId: account.id,
        date: new Date(Date.UTC(2026, 0, day, 12)),
        amountCents: -1000,
        description,
        categoryId: null,
      });
    await mk(`${TOKEN} alpha`, 1);
    await mk(`${TOKEN} beta`, 2);
    await mk(`${TOKEN} gamma`, 3);
    await mk("unrelated other", 4);

    // Lowercase query matches the uppercase token (SQLite LIKE, ASCII-insensitive).
    const found = await listTransactionsPage({ query: "zzqrytoken" });
    expect(found.total).toBe(3);
    expect(found.rows).toHaveLength(3);
    expect(found.rows[0].description).toBe(`${TOKEN} gamma`); // newest first

    // Two per page → 2 pages.
    const p1 = await listTransactionsPage({ query: "zzqrytoken", pageSize: 2, page: 1 });
    expect(p1.total).toBe(3);
    expect(p1.pageCount).toBe(2);
    expect(p1.rows).toHaveLength(2);

    const p2 = await listTransactionsPage({ query: "zzqrytoken", pageSize: 2, page: 2 });
    expect(p2.rows).toHaveLength(1);
    expect(p2.rows[0].id).not.toBe(p1.rows[0].id); // pages don't overlap
  });
});
