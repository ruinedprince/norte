// Rules engine (escopo §4 Fase 4) — the "guia". A rule compares a current
// metric against a threshold; when the condition holds, it raises an alert.
// Pure and framework-agnostic.

export type RuleMetric =
  | "savingsRate"
  | "portfolioDY"
  | "monthlySpend"
  | "netWorthChange3m";

export type RuleComparator = "below" | "above";

export const RULE_METRICS: {
  key: RuleMetric;
  label: string;
  unit: "percent" | "currency";
}[] = [
  { key: "savingsRate", label: "Taxa de poupança (mês)", unit: "percent" },
  { key: "portfolioDY", label: "DY da carteira", unit: "percent" },
  { key: "monthlySpend", label: "Gasto do mês", unit: "currency" },
  { key: "netWorthChange3m", label: "Variação do patrimônio (3m)", unit: "currency" },
];

export function metricUnit(metric: RuleMetric): "percent" | "currency" {
  return RULE_METRICS.find((m) => m.key === metric)?.unit ?? "currency";
}

export interface RuleLike {
  id: string;
  name: string;
  metric: RuleMetric;
  comparator: RuleComparator;
  /** Ratio for percent metrics, integer cents for currency metrics. */
  threshold: number;
  enabled: boolean;
}

/** Current values, keyed by metric (ratios for percent, cents for currency). */
export interface MetricSnapshot {
  savingsRate: number | null;
  portfolioDY: number | null;
  monthlySpend: number | null;
  netWorthChange3m: number | null;
}

export interface Alert {
  ruleId: string;
  name: string;
  metric: RuleMetric;
  comparator: RuleComparator;
  threshold: number;
  currentValue: number | null;
  triggered: boolean;
}

/** Evaluate the enabled rules against the snapshot. A rule with no available
 *  value is reported but never triggered. */
export function evaluateRules(rules: RuleLike[], snapshot: MetricSnapshot): Alert[] {
  return rules
    .filter((rule) => rule.enabled)
    .map((rule) => {
      const currentValue = snapshot[rule.metric];
      const triggered =
        currentValue != null &&
        (rule.comparator === "below"
          ? currentValue < rule.threshold
          : currentValue > rule.threshold);
      return {
        ruleId: rule.id,
        name: rule.name,
        metric: rule.metric,
        comparator: rule.comparator,
        threshold: rule.threshold,
        currentValue,
        triggered,
      };
    });
}
