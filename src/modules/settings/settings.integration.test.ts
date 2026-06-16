import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { getSavingsGoalRate, setSavingsGoalRate } from "./repository";

const KEY = "savingsGoalRate";
let saved: string | null = null;

// Save and restore the real value so running tests never clobbers a real goal.
beforeAll(async () => {
  const row = await prisma.setting.findUnique({ where: { key: KEY } });
  saved = row?.value ?? null;
  await prisma.setting.deleteMany({ where: { key: KEY } });
});

afterAll(async () => {
  if (saved === null) {
    await prisma.setting.deleteMany({ where: { key: KEY } });
  } else {
    await prisma.setting.upsert({
      where: { key: KEY },
      create: { key: KEY, value: saved },
      update: { value: saved },
    });
  }
  await prisma.$disconnect();
});

describe("savings goal setting (real SQLite via Prisma 7)", () => {
  it("defaults to 0.2 and round-trips a saved value", async () => {
    expect(await getSavingsGoalRate()).toBe(0.2);
    await setSavingsGoalRate(0.35);
    expect(await getSavingsGoalRate()).toBe(0.35);
  });
});
