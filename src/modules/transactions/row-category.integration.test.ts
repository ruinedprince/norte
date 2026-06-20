import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { createCategory } from "@/modules/categories/repository";

import {
  createManualTransaction,
  monthlyCashFlow,
  setTransactionCategory,
  setTransactionTransfer,
} from "./repository";

const ACCOUNT = "__rowcat_test__";
const CAT = "__rowcat_cat__";

async function cleanup() {
  await prisma.account.deleteMany({ where: { name: ACCOUNT } });
  await prisma.category.deleteMany({ where: { name: CAT } });
}

beforeAll(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

const findTx = (id: string) => prisma.transaction.findUnique({ where: { id } });

describe("per-row category + transfer (real SQLite via Prisma 7)", () => {
  it("sets/clears the category and toggles transfer out of the cash flow", async () => {
    const account = await prisma.account.create({
      data: { name: ACCOUNT, type: "cash", currency: "BRL" },
    });
    const cat = await createCategory({ name: CAT, kind: "need" });
    // March 2026 — a month isolated from any other data.
    const tx = await createManualTransaction({
      accountId: account.id,
      date: new Date(Date.UTC(2026, 2, 15, 12)),
      amountCents: -10000,
      description: "rowcat tx",
      categoryId: null,
    });

    // Manual category override, then clear.
    await setTransactionCategory(tx.id, cat.id);
    expect((await findTx(tx.id))?.categoryId).toBe(cat.id);
    await setTransactionCategory(tx.id, null);
    expect((await findTx(tx.id))?.categoryId).toBeNull();

    // Counts as expense before being marked a transfer.
    expect((await monthlyCashFlow()).find((p) => p.month === "2026-03")?.expenseCents).toBe(10000);

    // Mark as transfer → excluded from income/expense.
    await setTransactionTransfer(tx.id, true);
    expect((await findTx(tx.id))?.type).toBe("transfer");
    expect((await monthlyCashFlow()).find((p) => p.month === "2026-03")?.expenseCents ?? 0).toBe(0);

    // Unmark → back to expense, derived from the sign.
    await setTransactionTransfer(tx.id, false);
    expect((await findTx(tx.id))?.type).toBe("expense");
    expect((await monthlyCashFlow()).find((p) => p.month === "2026-03")?.expenseCents).toBe(10000);
  });
});
