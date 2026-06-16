import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { parseSignedCents } from "@/core/domain/money";
import { prisma } from "@/lib/prisma";

import { createManualTransaction, ensureDefaultCashAccount } from "./repository";

// Isolates by a marker description and only deletes those rows, so any real
// data in dev.db (including the user's Carteira wallet) is left intact.
const MARKER = "__manual_entry_test__";

async function cleanup() {
  await prisma.transaction.deleteMany({ where: { description: MARKER } });
}

beforeAll(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("manual entry (real SQLite via Prisma 7)", () => {
  it("stores a manual expense as signed cents and never false-dedups", async () => {
    const account = await ensureDefaultCashAccount();

    const amountCents = parseSignedCents("1.234,56", "expense");
    expect(amountCents).toBe(-123456);

    const date = new Date(Date.UTC(2026, 0, 10, 12));
    const first = await createManualTransaction({
      accountId: account.id,
      date,
      amountCents,
      description: MARKER,
    });
    const second = await createManualTransaction({
      accountId: account.id,
      date,
      amountCents,
      description: MARKER,
    });

    expect(first.source).toBe("manual");
    expect(first.amountCents).toBe(-123456);
    // Two identical manual entries are distinct rows (no false dedup).
    expect(first.id).not.toBe(second.id);
    expect(first.dedupKey).not.toBe(second.dedupKey);

    const count = await prisma.transaction.count({
      where: { description: MARKER },
    });
    expect(count).toBe(2);
  });
});
