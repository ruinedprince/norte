"use server";

import { revalidatePath } from "next/cache";

import { parseBRLToCents } from "@/core/domain/money";
import {
  metricUnit,
  RULE_METRICS,
  type RuleComparator,
  type RuleMetric,
} from "@/core/domain/rules";

import { createRule, deleteRule, setRuleEnabled } from "./repository";

const METRIC_KEYS = RULE_METRICS.map((m) => m.key);

export type RuleState = { ok: true } | { ok: false; error: string } | null;

function revalidateViews() {
  revalidatePath("/rules");
  revalidatePath("/");
}

export async function createRuleAction(
  _prev: RuleState,
  formData: FormData,
): Promise<RuleState> {
  const name = String(formData.get("name") ?? "").trim();
  const metricRaw = String(formData.get("metric") ?? "");
  const comparator: RuleComparator =
    String(formData.get("comparator") ?? "") === "above" ? "above" : "below";
  const thresholdRaw = String(formData.get("threshold") ?? "");

  if (!name) return { ok: false, error: "Dê um nome à regra." };
  if (!(METRIC_KEYS as string[]).includes(metricRaw)) {
    return { ok: false, error: "Escolha uma métrica." };
  }

  const metric = metricRaw as RuleMetric;
  const threshold =
    metricUnit(metric) === "percent"
      ? Number(thresholdRaw.replace(",", ".")) / 100
      : parseBRLToCents(thresholdRaw);
  if (!Number.isFinite(threshold)) {
    return { ok: false, error: "Informe um limiar válido." };
  }

  await createRule({ name, metric, comparator, threshold });
  revalidateViews();
  return { ok: true };
}

export async function deleteRuleAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteRule(id);
  revalidateViews();
}

export async function toggleRuleAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await setRuleEnabled(id, String(formData.get("enabled") ?? "") === "true");
  revalidateViews();
}
