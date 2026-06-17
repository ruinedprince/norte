import Link from "next/link";

import { ChevronRight, Compass } from "lucide-react";

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
import { monthlyPassiveIncome } from "@/modules/investments/repository";
import { netWorthAnalysis } from "@/modules/analysis/repository";
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

const ONBOARDING_STEPS = [
  { href: "/transactions", title: "Importe ou lance transações", desc: "OFX do banco ou lançamento manual" },
  { href: "/categories", title: "Crie categorias e regras", desc: "pro Norte categorizar sozinho" },
  { href: "/accounts", title: "Cadastre contas e saldos", desc: "a semente do patrimônio" },
  { href: "/investments", title: "Registre investimentos", desc: "posições, cotações e dividendos" },
];

export default async function DashboardPage() {
  const [
    spending,
    cashFlow,
    byCategory,
    recent,
    stats,
    goalRate,
    budgetSplit,
    alerts,
    netWorth,
    passiveIncome,
  ] = await Promise.all([
    monthlySpending(),
    monthlyCashFlow(),
    spendByCategory(),
    listTransactions(8),
    getStats(),
    getSavingsGoalRate(),
    latestMonthBudgetSplit(),
    evaluateAlerts(),
    netWorthAnalysis(),
    monthlyPassiveIncome(),
  ]);
  const triggeredAlerts = alerts.filter((a) => a.triggered);
  const passiva12mCents = passiveIncome
    .slice(-12)
    .reduce((sum, point) => sum + point.incomeCents, 0);

  const latestFlow = cashFlow.at(-1);
  const rateColor =
    latestFlow?.savingsRate == null
      ? "text-muted-foreground"
      : latestFlow.savingsRate >= 0
        ? "text-positive"
        : "text-destructive";

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
        <h1 className="font-serif text-3xl">Painel</h1>
        <p className="mt-1 text-muted-foreground">
          Pra onde o dinheiro foi — o ponto de partida do Norte.
        </p>
      </header>

      {stats.txCount === 0 ? (
        <Card>
          <CardContent className="flex flex-col gap-6 py-10">
            <div className="flex flex-col items-center gap-2 text-center">
              <Compass className="size-8 text-primary" />
              <h2 className="font-serif text-2xl">Bem-vindo ao Norte</h2>
              <p className="max-w-md text-muted-foreground">
                Sua bússola financeira. Registre seus dados e o Painel mostra pra
                onde o dinheiro vai — e quão perto você está de não depender do
                trabalho.
              </p>
            </div>
            <ol className="mx-auto flex w-full max-w-md flex-col gap-2 reveal-stagger">
              {ONBOARDING_STEPS.map((step, index) => (
                <li key={step.href}>
                  <Link
                    href={step.href}
                    className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {index + 1}
                    </span>
                    <span className="flex-1">
                      <span className="font-medium">{step.title}</span>
                      <span className="block text-sm text-muted-foreground">{step.desc}</span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6 reveal-stagger">
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
                  Patrimônio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className={cn(
                    "font-serif text-4xl tabular-nums",
                    netWorth.currentCents < 0 ? "text-destructive" : "text-foreground",
                  )}
                >
                  {formatBRL(netWorth.currentCents)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Caixa + investimentos
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Renda passiva (12m)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-serif text-4xl tabular-nums text-positive">
                  {formatBRL(passiva12mCents)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Dividendos recebidos
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
