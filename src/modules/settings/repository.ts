import { prisma } from "@/lib/prisma";

const SAVINGS_GOAL_KEY = "savingsGoalRate";
const DEFAULT_SAVINGS_GOAL = 0.2; // 20% — the classic pay-yourself-first target.

/** The monthly savings goal as a ratio (0.2 = 20%); defaults when unset. */
export async function getSavingsGoalRate(): Promise<number> {
  const row = await prisma.setting.findUnique({ where: { key: SAVINGS_GOAL_KEY } });
  if (!row) return DEFAULT_SAVINGS_GOAL;
  const value = Number(row.value);
  return Number.isFinite(value) ? value : DEFAULT_SAVINGS_GOAL;
}

export async function setSavingsGoalRate(rate: number): Promise<void> {
  await prisma.setting.upsert({
    where: { key: SAVINGS_GOAL_KEY },
    create: { key: SAVINGS_GOAL_KEY, value: String(rate) },
    update: { value: String(rate) },
  });
}
