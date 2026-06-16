import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { createRule, evaluateAlerts } from "./repository";

const NAME = "__rule_engine_test__";

async function cleanup() {
  await prisma.rule.deleteMany({ where: { name: NAME } });
}

beforeAll(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("rules engine (real SQLite via Prisma 7)", () => {
  it("creates a rule and evaluates it against the live snapshot", async () => {
    await createRule({ name: NAME, metric: "savingsRate", comparator: "below", threshold: 0.2 });
    const mine = (await evaluateAlerts()).find((a) => a.name === NAME);
    expect(mine).toBeDefined();
    expect(mine?.metric).toBe("savingsRate");
    expect(typeof mine?.triggered).toBe("boolean");
  });
});
