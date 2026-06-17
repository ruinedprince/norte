import Link from "next/link";

import { formatBRL } from "@/core/domain/money";
import { BudgetSplitCard } from "@/modules/analysis/components/budget-split-card";
import { CashFlowChart } from "@/modules/analysis/components/cash-flow-chart";
import { CategorySpendChart } from "@/modules/analysis/components/category-spend-chart";
import { MonthlySpendChart } from "@/modules/analysis/components/monthly-spend-chart";
import {
  getStats,
  latestMonthBudgetSplit,
  listTransactions,
  monthlyCashFlow,
  monthlySpending,
  spendByCategory,
} from "@/modules/transactions/repository";
import { TransactionsTable } from "@/modules/transactions/components/transactions-table";
import { SavingsGoalCard } from "@/modules/settings/components/savings-goal-card";
import { getSavingsGoalRate } from "@/modules/settings/repository";
import { AlertsBanner } from "@/modules/rules/components/alerts-banner";
import { evaluateAlerts } from "@/modules/rules/repository";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatMonthLabel, formatPercent } from "@/lib/format";

// Always reflect the latest database state (revalidated after each import).
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [spending, cashFlow, byCategory, recent, stats, goalRate, budgetSplit, alerts] =
    await Promise.all([
      monthlySpending(),
      monthlyCashFlow(),
      spendByCategory(),
      listTransactions(8),
      getStats(),
      getSavingsGoalRate(),
      latestMonthBudgetSplit(),
      evaluateAlerts(),
    ]);
  const triggeredAlerts = alerts.filter((a) => a.triggered);

  const latestFlow = cashFlow.at(-1);
  const rateColor =
    latestFlow?.savingsRate == null
      ? "text-muted-foreground"
      : latestFlow.savingsRate >= 0
        ? "text-positive"
        : "text-destructive";

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8">
        <h1 className="font-serif text-3xl">Painel</h1>
        <p className="mt-1 text-muted-foreground">
          Pra onde o dinheiro foi — o ponto de partida do Norte.
        </p>
      </header>

      {stats.txCount === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="max-w-sm text-muted-foreground">
              Nenhuma transação ainda. Importe um extrato OFX do seu banco para
              ver pra onde o dinheiro está indo.
            </p>
            <Button asChild size="lg">
              <Link href="/transactions">Importar extrato OFX</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <AlertsBanner
            count={triggeredAlerts.length}
            names={triggeredAlerts.map((a) => a.name)}
          />
          <section className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Taxa de poupança ·{" "}
                  {latestFlow ? formatMonthLabel(latestFlow.month) : "—"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={cn("font-serif text-4xl tabular-nums", rateColor)}>
                  {latestFlow?.savingsRate != null
                    ? formatPercent(latestFlow.savingsRate)
                    : "—"}
                </p>
                {latestFlow && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Saldo do mês {formatBRL(latestFlow.netCents)}
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Receita ·{" "}
                  {latestFlow ? formatMonthLabel(latestFlow.month) : "—"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-serif text-4xl tabular-nums text-positive">
                  {formatBRL(latestFlow?.incomeCents ?? 0)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Despesa ·{" "}
                  {latestFlow ? formatMonthLabel(latestFlow.month) : "—"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-serif text-4xl tabular-nums">
                  {formatBRL(latestFlow?.expenseCents ?? 0)}
                </p>
              </CardContent>
            </Card>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Meta de poupança</CardTitle>
              </CardHeader>
              <CardContent>
                <SavingsGoalCard
                  goalRate={goalRate}
                  latestRate={latestFlow?.savingsRate ?? null}
                  latestMonthLabel={
                    latestFlow ? formatMonthLabel(latestFlow.month) : null
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  50/30/20 ·{" "}
                  {latestFlow ? formatMonthLabel(latestFlow.month) : "—"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BudgetSplitCard split={budgetSplit} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Receita × despesa por mês</CardTitle>
            </CardHeader>
            <CardContent>
              <CashFlowChart data={cashFlow} />
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Gasto por mês</CardTitle>
              </CardHeader>
              <CardContent>
                <MonthlySpendChart data={spending} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gasto por categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <CategorySpendChart data={byCategory} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Últimas transações</CardTitle>
              <Button asChild variant="link" size="sm">
                <Link href="/transactions">Ver todas</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <TransactionsTable rows={recent} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
