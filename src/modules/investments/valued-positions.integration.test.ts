import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import {
  createAsset,
  createInvestmentTransaction,
  listValuedPositions,
  saveQuote,
} from "./repository";

const TICKER = "VALU11";

async function cleanup() {
  await prisma.asset.deleteMany({ where: { ticker: TICKER } });
}

beforeAll(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("valued positions (real SQLite via Prisma 7)", () => {
  it("values a position at its latest stored quote", async () => {
    const asset = await createAsset({ ticker: TICKER, kind: "fii", name: "Valued FII" });
    await createInvestmentTransaction({
      assetId: asset.id,
      date: new Date(Date.UTC(2024, 0, 1, 12)),
      kind: "buy",
      quantity: 10,
      unitPriceCents: 1000,
    });
    await saveQuote({ assetId: asset.id, closeCents: 1500, date: new Date(Date.UTC(2024, 5, 1, 12)) });

    const position = (await listValuedPositions()).find((p) => p.ticker === TICKER);
    expect(position).toMatchObject({
      quantity: 10,
      investedCents: 10000,
      currentPriceCents: 1500,
      marketValueCents: 15000,
      gainCents: 5000,
    });
  });
});
