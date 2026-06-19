import { formatBRL } from "@/core/domain/money";
import { IncomeMixChart } from "@/modules/analysis/components/income-mix-chart";
import { NetWorthChart } from "@/modules/analysis/components/net-worth-chart";
import { incomeMix, netWorthAnalysis } from "@/modules/analysis/repository";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPercent, formatPercent1 } from "@/lib/format";
import { cn } from "@/lib/utils";

// Always reflect the latest database state.
export const dynamic = "force-dynamic";

export const metadata = { title: "Análise" };

export default async function AnalysisPage() {
  const [nw, mix] = await Promise.all([netWorthAnalysis(), incomeMix()]);
  const change = nw.change3mCents;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10 reveal-stagger">
      <header>
        <h1 className="font-serif text-3xl">Análise</h1>
        <p className="mt-1 text-muted-foreground">
          A trajetória do patrimônio e suas tendências — descritivo, sem prever o
          futuro.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Patrimônio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-serif text-4xl tabular-nums">
              {formatBRL(nw.currentCents)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Variação (3 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "font-serif text-4xl tabular-nums",
                change == null
                  ? "text-muted-foreground"
                  : change >= 0
                    ? "text-positive"
                    : "text-destructive",
              )}
            >
              {change == null ? "—" : `${change >= 0 ? "+" : ""}${formatBRL(change)}`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Maior queda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-serif text-4xl tabular-nums">
              {formatPercent(nw.drawdown)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Pico a vale no período.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tendência (mês)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "font-serif text-4xl tabular-nums",
                nw.slopeCentsPerMonth == null
                  ? "text-muted-foreground"
                  : nw.slopeCentsPerMonth >= 0
                    ? "text-positive"
                    : "text-destructive",
              )}
            >
              {nw.slopeCentsPerMonth == null
                ? "—"
                : `${nw.slopeCentsPerMonth >= 0 ? "+" : ""}${formatBRL(Math.round(nw.slopeCentsPerMonth))}`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ajuste linear do período.
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Patrimônio no tempo</CardTitle>
          <CardDescription>
            Caixa + investimentos a mercado, com a média móvel de 3 meses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NetWorthChart
            data={nw.series.map((point, i) => ({ ...point, maCents: nw.maSeries[i] }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Renda: ativa × dividendos</CardTitle>
          <CardDescription>Quanto da sua renda já vem de dividendos.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Dividendos na renda (12 meses)
            </p>
            <p className="font-serif text-3xl tabular-nums text-positive">
              {mix.share12m != null ? formatPercent1(mix.share12m) : "—"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatBRL(mix.passive12mCents)} de{" "}
              {formatBRL(mix.active12mCents + mix.passive12mCents)} em 12 meses
            </p>
          </div>
          <IncomeMixChart data={mix.series} />
        </CardContent>
      </Card>
    </div>
  );
}
