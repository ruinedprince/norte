import {
  evaluateRules,
  type Alert,
  type MetricSnapshot,
  type RuleComparator,
  type RuleMetric,
} from "@/core/domain/rules";
import { netWorthAnalysis } from "@/modules/analysis/repository";
import { portfolioDividendYield } from "@/modules/investments/repository";
import { monthlyCashFlow, monthlySpending } from "@/modules/transactions/repository";
import { prisma } from "@/lib/prisma";

export function listRules() {
  return prisma.rule.findMany({ orderBy: [{ createdAt: "desc" }] });
}

export function createRule(input: {
  name: string;
  metric: RuleMetric;
  comparator: RuleComparator;
  threshold: number;
}) {
  return prisma.rule.create({ data: input });
}

export function deleteRule(id: string) {
  return prisma.rule.delete({ where: { id } });
}

export function setRuleEnabled(id: string, enabled: boolean) {
  return prisma.rule.update({ where: { id }, data: { enabled } });
}

/** Snapshot of the metrics rules can watch (escopo §4). */
export async function buildSnapshot(): Promise<MetricSnapshot> {
  const [cashFlow, spending, dy, nw] = await Promise.all([
    monthlyCashFlow(),
    monthlySpending(),
    portfolioDividendYield(),
    netWorthAnalysis(),
  ]);
  return {
    savingsRate: cashFlow.at(-1)?.savingsRate ?? null,
    portfolioDY: dy.dy,
    monthlySpend: spending.at(-1)?.spentCents ?? null,
    netWorthChange3m: nw.change3mCents,
  };
}

/** Current alerts, triggered ones first. */
export async function evaluateAlerts(): Promise<Alert[]> {
  const [rules, snapshot] = await Promise.all([listRules(), buildSnapshot()]);
  const typed = rules.map((r) => ({
    id: r.id,
    name: r.name,
    metric: r.metric as RuleMetric,
    comparator: r.comparator as RuleComparator,
    threshold: r.threshold,
    enabled: r.enabled,
  }));
  return evaluateRules(typed, snapshot).sort(
    (a, b) => Number(b.triggered) - Number(a.triggered),
  );
}
