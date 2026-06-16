import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import {
  createAsset,
  createInvestmentTransaction,
  portfolioAllocation,
  saveQuote,
} from "./repository";

const A = "ALOA11";
const B = "ALOB11";

async function cleanup() {
  await prisma.asset.deleteMany({ where: { ticker: { in: [A, B] } } });
}

beforeAll(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("portfolio allocation (real SQLite via Prisma 7)", () => {
  it("allocates by market value", async () => {
    const a = await createAsset({ ticker: A, kind: "fii", name: "Alloc A" });
    const b = await createAsset({ ticker: B, kind: "stock", name: "Alloc B" });
    const buy = (assetId: string, unitPriceCents: number) =>
      createInvestmentTransaction({
        assetId,
        date: new Date(Date.UTC(2024, 0, 1, 12)),
        kind: "buy",
        quantity: 10,
        unitPriceCents,
      });
    await buy(a.id, 1000);
    await buy(b.id, 2000);
    await saveQuote({ assetId: a.id, closeCents: 1000, date: new Date(Date.UTC(2024, 5, 1, 12)) });
    await saveQuote({ assetId: b.id, closeCents: 3000, date: new Date(Date.UTC(2024, 5, 1, 12)) });

    const { byAsset } = await portfolioAllocation();
    // A = 10×1000 = 10_000 (25%); B = 10×3000 = 30_000 (75%)
    expect(byAsset.find((s) => s.key === A)?.fraction).toBeCloseTo(0.25, 5);
    expect(byAsset.find((s) => s.key === B)?.fraction).toBeCloseTo(0.75, 5);
  });
});
