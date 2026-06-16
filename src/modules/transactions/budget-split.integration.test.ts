import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { latestMonthBudgetSplit } from "./repository";

const MARK = "__budget_split_test__";

async function cleanup() {
  await prisma.account.deleteMany({ where: { name: MARK } });
  await prisma.category.deleteMany({ where: { name: { startsWith: MARK } } });
}

beforeAll(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("50/30/20 split (real SQLite via Prisma 7)", () => {
  it("buckets the latest month's spend by category kind", async () => {
    // A far-future month so it is unambiguously the latest, whatever else is in db.
    const account = await prisma.account.create({
      data: { name: MARK, type: "checking", currency: "BRL" },
    });
    const need = await prisma.category.create({ data: { name: `${MARK}-need`, kind: "need" } });
    const want = await prisma.category.create({ data: { name: `${MARK}-want`, kind: "want" } });
    const day = (d: number) => new Date(Date.UTC(2099, 0, d, 12));

    await prisma.transaction.createMany({
      data: [
        { accountId: account.id, date: day(5), amountCents: 1000000, type: "income", description: "sal", source: "manual", dedupKey: "bsplit-1" },
        { accountId: account.id, date: day(10), amountCents: -500000, type: "expense", description: "rent", source: "manual", dedupKey: "bsplit-2", categoryId: need.id },
        { accountId: account.id, date: day(15), amountCents: -200000, type: "expense", description: "fun", source: "manual", dedupKey: "bsplit-3", categoryId: want.id },
      ],
    });

    const split = await latestMonthBudgetSplit();
    expect(split?.month).toBe("2099-01");
    expect(split?.incomeCents).toBe(1000000);
    expect(split?.needsCents).toBe(500000);
    expect(split?.wantsCents).toBe(200000);
    expect(split?.savedCents).toBe(300000); // 1_000_000 − 500_000 − 200_000
  });
});
