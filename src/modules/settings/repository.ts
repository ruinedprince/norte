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

const TARGET_ALLOC_KEY = "targetAllocationByKind";

/** Target portfolio allocation by asset kind, as percentages (e.g. {fii: 50}).
 *  Empty object when no plan is set. Only finite positive values are kept. */
export async function getTargetAllocation(): Promise<Record<string, number>> {
  const row = await prisma.setting.findUnique({ where: { key: TARGET_ALLOC_KEY } });
  if (!row) return {};
  try {
    const parsed: unknown = JSON.parse(row.value);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      const n = Number(value);
      if (Number.isFinite(n) && n > 0) out[key] = n;
    }
    return out;
  } catch {
    return {};
  }
}

export async function setTargetAllocation(targets: Record<string, number>): Promise<void> {
  await prisma.setting.upsert({
    where: { key: TARGET_ALLOC_KEY },
    create: { key: TARGET_ALLOC_KEY, value: JSON.stringify(targets) },
    update: { value: JSON.stringify(targets) },
  });
}
