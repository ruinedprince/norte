import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { listAccountsWithBalances } from "@/modules/accounts/repository";
import { monthlyCashFlow } from "@/modules/transactions/repository";
import {
  createAsset,
  createInvestmentTransaction,
  listValuedPositions,
  saveQuote,
} from "./repository";

const TICKER = "APOR11";
const ACCOUNT = "__aporte_caixa_test__";

async function cleanup() {
  await prisma.asset.deleteMany({ where: { ticker: TICKER } });
  await prisma.account.deleteMany({ where: { name: ACCOUNT } });
}

beforeAll(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("aporte↔caixa (real SQLite via Prisma 7)", () => {
  it("debits the funding account, stays out of expenses, and avoids double-counting", async () => {
    const account = await prisma.account.create({
      data: { name: ACCOUNT, type: "cash", currency: "BRL", openingBalanceCents: 1000000 },
    });
    const asset = await createAsset({ ticker: TICKER, kind: "fii", name: "Aporte FII" });

    // Buy 100 @ R$10,00 = R$1.000, funded by the account.
    await createInvestmentTransaction({
      assetId: asset.id,
      date: new Date(Date.UTC(2026, 0, 10, 12)),
      kind: "buy",
      quantity: 100,
      unitPriceCents: 1000,
      accountId: account.id,
    });
    await saveQuote({ assetId: asset.id, closeCents: 1000, date: new Date(Date.UTC(2026, 0, 10, 12)) });

    // 1. A paired transfer debited the account by R$1.000.
    const transfer = await prisma.transaction.findFirst({
      where: { accountId: account.id, type: "transfer" },
    });
    expect(transfer?.amountCents).toBe(-100000);

    // 2. Balance = opening − aporte (the money left the cash side).
    const balance = (await listAccountsWithBalances()).find((a) => a.id === account.id);
    expect(balance?.balanceCents).toBe(900000);

    // 3. The transfer is NOT counted as expense (Jan has only this transfer).
    const jan = (await monthlyCashFlow()).find((p) => p.month === "2026-01");
    expect(jan?.expenseCents ?? 0).toBe(0);

    // 4. No double count: 900000 cash + 100000 position = 1_000_000 (the opening).
    const position = (await listValuedPositions()).find((p) => p.ticker === TICKER);
    expect(position?.marketValueCents).toBe(100000);
  });
});
