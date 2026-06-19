import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import {
  createAsset,
  createDividend,
  createInvestmentTransaction,
  listValuedPositions,
  saveQuote,
  setAssetBookValue,
} from "./repository";

const TICKER = "INDIC11";
const DAY = 24 * 60 * 60 * 1000;

async function cleanup() {
  // Quotes, dividends and investment transactions cascade on asset delete.
  await prisma.asset.deleteMany({ where: { ticker: TICKER } });
}

beforeAll(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("FII indicators (real SQLite via Prisma 7)", () => {
  it("derives P/VP from VPA and a trailing-12m dividend yield", async () => {
    const asset = await createAsset({ ticker: TICKER, kind: "fii", name: "Indicador FII" });
    await createInvestmentTransaction({
      assetId: asset.id,
      date: new Date(Date.now() - 200 * DAY),
      kind: "buy",
      quantity: 100,
      unitPriceCents: 980,
    });

    // VPA R$10,00 (book value per share) and a current price of R$11,50.
    await setAssetBookValue(asset.id, 1000);
    await saveQuote({ assetId: asset.id, closeCents: 1150, date: new Date() });

    // Two payments inside the 12-month window (60 + 60 = 120 c/share) and one
    // well outside it that must NOT count toward the trailing yield.
    await createDividend({
      assetId: asset.id,
      exDate: new Date(Date.now() - 30 * DAY),
      payDate: new Date(Date.now() - 30 * DAY),
      perShareCents: 60,
    });
    await createDividend({
      assetId: asset.id,
      exDate: new Date(Date.now() - 60 * DAY),
      payDate: new Date(Date.now() - 60 * DAY),
      perShareCents: 60,
    });
    await createDividend({
      assetId: asset.id,
      exDate: new Date(Date.now() - 400 * DAY),
      payDate: new Date(Date.now() - 400 * DAY),
      perShareCents: 999,
    });

    const position = (await listValuedPositions()).find((p) => p.ticker === TICKER);
    expect(position).toBeDefined();
    expect(position?.bookValuePerShareCents).toBe(1000);
    expect(position?.currentPriceCents).toBe(1150);
    // P/VP = 1150 / 1000.
    expect(position?.priceToBook).toBeCloseTo(1.15, 10);
    // DY = (60 + 60) / 1150 — the 400-day-old payment is excluded.
    expect(position?.dividendYield).toBeCloseTo(120 / 1150, 10);
  });
});
