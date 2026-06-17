import { formatBRL } from "@/core/domain/money";
import { metricUnit, RULE_METRICS, type RuleMetric } from "@/core/domain/rules";
import { deleteRuleAction, toggleRuleAction } from "@/modules/rules/actions";
import { RuleForm } from "@/modules/rules/components/rule-form";
import { evaluateAlerts, listRules } from "@/modules/rules/repository";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPercent1 } from "@/lib/format";
import { cn } from "@/lib/utils";

// Always reflect the latest database state.
export const dynamic = "force-dynamic";

const METRIC_LABELS: Record<string, string> = Object.fromEntries(
  RULE_METRICS.map((m) => [m.key, m.label]),
);
const COMPARATOR_LABELS: Record<string, string> = { below: "abaixo de", above: "acima de" };

function formatMetric(metric: RuleMetric, value: number | null): string {
  if (value == null) return "—";
  return metricUnit(metric) === "percent" ? formatPercent1(value) : formatBRL(value);
}

export default async function RulesPage() {
  const [alerts, rules] = await Promise.all([evaluateAlerts(), listRules()]);
  const triggered = alerts.filter((a) => a.triggered).length;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10 reveal-stagger">
      <header>
        <h1 className="font-serif text-3xl">Regras</h1>
        <p className="mt-1 text-muted-foreground">
          O guia: alertas quando algo sai do alvo que você definiu.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Alertas{triggered > 0 ? ` · ${triggered}` : ""}</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma regra ativa. Crie uma abaixo.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {alerts.map((alert) => (
                <li
                  key={alert.ruleId}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5",
                    alert.triggered ? "border-destructive/30 bg-destructive/5" : "border-border",
                  )}
                >
                  <div>
                    <p className="font-medium">{alert.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {METRIC_LABELS[alert.metric]}:{" "}
                      <span className="text-foreground">
                        {formatMetric(alert.metric, alert.currentValue)}
                      </span>{" "}
                      · regra: {COMPARATOR_LABELS[alert.comparator]}{" "}
                      {formatMetric(alert.metric, alert.threshold)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      alert.currentValue == null
                        ? "text-muted-foreground"
                        : alert.triggered
                          ? "text-destructive"
                          : "text-positive",
                    )}
                  >
                    {alert.currentValue == null ? "sem dados" : alert.triggered ? "Alerta" : "ok"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nova regra</CardTitle>
          <CardDescription>Escolha a métrica, o comparador e o limiar.</CardDescription>
        </CardHeader>
        <CardContent>
          <RuleForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suas regras</CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma regra ainda.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {rules.map((rule) => (
                <li key={rule.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="text-sm">
                    <span className="font-medium">{rule.name}</span>
                    <span className="ml-2 text-muted-foreground">
                      {METRIC_LABELS[rule.metric] ?? rule.metric}{" "}
                      {COMPARATOR_LABELS[rule.comparator] ?? rule.comparator}{" "}
                      {formatMetric(rule.metric as RuleMetric, rule.threshold)}
                    </span>
                    {!rule.enabled && (
                      <span className="ml-2 text-xs text-muted-foreground">(desativada)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <form action={toggleRuleAction}>
                      <input type="hidden" name="id" value={rule.id} />
                      <input type="hidden" name="enabled" value={rule.enabled ? "false" : "true"} />
                      <Button type="submit" variant="ghost" size="sm">
                        {rule.enabled ? "Desativar" : "Ativar"}
                      </Button>
                    </form>
                    <form action={deleteRuleAction}>
                      <input type="hidden" name="id" value={rule.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Excluir
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
