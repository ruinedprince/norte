import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import {
  createAsset,
  createDividend,
  createInvestmentTransaction,
  listDividends,
  monthlyPassiveIncome,
} from "./repository";

const TICKER = "DIVI11";

async function cleanup() {
  await prisma.asset.deleteMany({ where: { ticker: TICKER } });
}

beforeAll(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("dividends / passive income (real SQLite via Prisma 7)", () => {
  it("uses the quantity held at the pay date", async () => {
    const asset = await createAsset({ ticker: TICKER, kind: "fii", name: "Dividend FII" });
    await createInvestmentTransaction({
      assetId: asset.id,
      date: new Date(Date.UTC(2024, 0, 1, 12)),
      kind: "buy",
      quantity: 100,
      unitPriceCents: 1000,
    });
    await createDividend({
      assetId: asset.id,
      exDate: new Date(Date.UTC(2024, 1, 1, 12)),
      payDate: new Date(Date.UTC(2024, 1, 15, 12)),
      perShareCents: 10,
    });

    const row = (await listDividends()).find((d) => d.ticker === TICKER);
    expect(row).toMatchObject({ quantityAtPay: 100, incomeCents: 1000 });

    const feb = (await monthlyPassiveIncome()).find((p) => p.month === "2024-02");
    expect(feb?.incomeCents).toBe(1000);
  });
});
