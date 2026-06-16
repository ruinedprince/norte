import Link from "next/link";

import { formatBRL } from "@/core/domain/money";
import { MonthlySpendChart } from "@/modules/analysis/components/monthly-spend-chart";
import {
  getStats,
  listTransactions,
  monthlySpending,
} from "@/modules/transactions/repository";
import { TransactionsTable } from "@/modules/transactions/components/transactions-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMonthLabel } from "@/lib/format";

// Always reflect the latest database state (revalidated after each import).
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [spending, recent, stats] = await Promise.all([
    monthlySpending(),
    listTransactions(8),
    getStats(),
  ]);

  const latest = spending.at(-1);

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
          <section className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Gasto em {latest ? formatMonthLabel(latest.month) : "—"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-serif text-4xl tabular-nums">
                  {formatBRL(latest?.spentCents ?? 0)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Transações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-serif text-4xl tabular-nums">
                  {stats.txCount}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Contas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-serif text-4xl tabular-nums">
                  {stats.accountCount}
                </p>
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Gasto por mês</CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlySpendChart data={spending} />
            </CardContent>
          </Card>

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
