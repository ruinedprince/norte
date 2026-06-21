import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";

import { getTargetAllocation, setTargetAllocation } from "./repository";

const KEY = "targetAllocationByKind";

async function reset() {
  await prisma.setting.deleteMany({ where: { key: KEY } });
}

beforeAll(reset);
afterAll(async () => {
  await reset();
  await prisma.$disconnect();
});

describe("target allocation (real SQLite via Prisma 7)", () => {
  it("round-trips and keeps only positive finite values", async () => {
    expect(await getTargetAllocation()).toEqual({}); // unset → empty
    await setTargetAllocation({ fii: 50, stock: 30, etf: 20 });
    expect(await getTargetAllocation()).toEqual({ fii: 50, stock: 30, etf: 20 });
    // Zeros are dropped on read.
    await setTargetAllocation({ fii: 100, stock: 0 });
    expect(await getTargetAllocation()).toEqual({ fii: 100 });
  });
});
