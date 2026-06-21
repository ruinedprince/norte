"use server";

import { revalidatePath } from "next/cache";

import { setSavingsGoalRate, setTargetAllocation } from "./repository";

export type GoalState = { ok: true } | { ok: false; error: string } | null;

export async function setSavingsGoalAction(
  _prev: GoalState,
  formData: FormData,
): Promise<GoalState> {
  const percent = Number(String(formData.get("percent") ?? "").replace(",", "."));
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    return { ok: false, error: "Informe uma meta entre 0 e 100%." };
  }
  await setSavingsGoalRate(percent / 100);
  revalidatePath("/");
  return { ok: true };
}

export type AllocState = { ok: true } | { ok: false; error: string } | null;

const ALLOC_KINDS = ["fii", "stock", "etf"] as const;

/** Save the target allocation by kind (percentages). Blank fields are dropped;
 *  values must be 0..100. The user's own plan — descriptive, not advice. */
export async function setTargetAllocationAction(
  _prev: AllocState,
  formData: FormData,
): Promise<AllocState> {
  const targets: Record<string, number> = {};
  for (const kind of ALLOC_KINDS) {
    const raw = String(formData.get(kind) ?? "").replace(",", ".").trim();
    if (raw === "") continue;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      return { ok: false, error: "Use percentuais entre 0 e 100." };
    }
    if (n > 0) targets[kind] = n;
  }
  await setTargetAllocation(targets);
  revalidatePath("/investments");
  return { ok: true };
}
