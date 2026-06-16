import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import {
  createAsset,
  createInvestmentTransaction,
  listPositions,
} from "./repository";

const TICKER = "TEST11";

async function cleanup() {
  await prisma.asset.deleteMany({ where: { ticker: TICKER } });
}

beforeAll(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("positions (real SQLite via Prisma 7)", () => {
  it("derives a position from stored buy transactions", async () => {
    const asset = await createAsset({ ticker: TICKER, kind: "fii", name: "Test FII" });
    await createInvestmentTransaction({
      assetId: asset.id,
      date: new Date(Date.UTC(2024, 0, 1, 12)),
      kind: "buy",
      quantity: 10,
      unitPriceCents: 1000,
    });
    await createInvestmentTransaction({
      assetId: asset.id,
      date: new Date(Date.UTC(2024, 1, 1, 12)),
      kind: "buy",
      quantity: 10,
      unitPriceCents: 1200,
    });

    const position = (await listPositions()).find((p) => p.ticker === TICKER);
    expect(position).toMatchObject({
      quantity: 20,
      avgCostCents: 1100,
      investedCents: 22000,
    });
  });
});
