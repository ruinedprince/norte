import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { createAccount, listAccountsWithBalances } from "./repository";

const NAME = "__acct_balance_test__";

async function cleanup() {
  await prisma.account.deleteMany({ where: { name: NAME } });
}

beforeAll(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("account balances (real SQLite via Prisma 7)", () => {
  it("balance = opening balance + sum of transactions", async () => {
    const account = await createAccount({
      name: NAME,
      type: "checking",
      openingBalanceCents: 100000,
    });
    await prisma.transaction.createMany({
      data: [
        {
          accountId: account.id,
          date: new Date(Date.UTC(2026, 0, 1, 12)),
          amountCents: 50000,
          type: "income",
          description: "x",
          source: "manual",
          dedupKey: "acct-test-1",
        },
        {
          accountId: account.id,
          date: new Date(Date.UTC(2026, 0, 2, 12)),
          amountCents: -20000,
          type: "expense",
          description: "y",
          source: "manual",
          dedupKey: "acct-test-2",
        },
      ],
    });

    const mine = (await listAccountsWithBalances()).find((a) => a.id === account.id);
    expect(mine?.balanceCents).toBe(130000); // 100000 + 50000 - 20000
    expect(mine?.txCount).toBe(2);
  });
});
