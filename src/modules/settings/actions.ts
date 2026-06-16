"use server";

import { revalidatePath } from "next/cache";

import { setSavingsGoalRate } from "./repository";

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
