import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import {
  createAsset,
  createDividend,
  createInvestmentTransaction,
  dividendCalendar,
} from "./repository";

const TICKER = "CALEN11";
const DAY = 24 * 60 * 60 * 1000;

async function cleanup() {
  await prisma.asset.deleteMany({ where: { ticker: TICKER } });
}

beforeAll(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("dividend calendar (real SQLite via Prisma 7)", () => {
  it("lists upcoming dividends (ascending, with expected income), excluding past ones", async () => {
    const asset = await createAsset({ ticker: TICKER, kind: "fii", name: "Calendário FII" });
    await createInvestmentTransaction({
      assetId: asset.id,
      date: new Date(Date.now() - 100 * DAY),
      kind: "buy",
      quantity: 200,
      unitPriceCents: 1000,
    });

    // Two future payments and one already paid.
    await createDividend({
      assetId: asset.id,
      exDate: new Date(Date.now() + 5 * DAY),
      payDate: new Date(Date.now() + 10 * DAY),
      perShareCents: 12,
    });
    await createDividend({
      assetId: asset.id,
      exDate: new Date(Date.now()),
      payDate: new Date(Date.now() + 3 * DAY),
      perShareCents: 8,
    });
    await createDividend({
      assetId: asset.id,
      exDate: new Date(Date.now() - 40 * DAY),
      payDate: new Date(Date.now() - 35 * DAY),
      perShareCents: 10,
    });

    const calendar = (await dividendCalendar()).filter((e) => e.ticker === TICKER);

    // Only the two upcoming ones, earliest pay date first.
    expect(calendar.map((e) => e.perShareCents)).toEqual([8, 12]);
    // Expected income = quantity held (200) × per-share.
    expect(calendar[0].quantity).toBe(200);
    expect(calendar[0].incomeCents).toBe(1600);
    expect(calendar[1].incomeCents).toBe(2400);
  });
});
