import { formatBRL } from "@/core/domain/money";
import { NetWorthChart } from "@/modules/analysis/components/net-worth-chart";
import { netWorthAnalysis } from "@/modules/analysis/repository";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

// Always reflect the latest database state.
export const dynamic = "force-dynamic";

export default async function AnalysisPage() {
  const nw = await netWorthAnalysis();
  const change = nw.change3mCents;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <header>
        <h1 className="font-serif text-3xl">Análise</h1>
        <p className="mt-1 text-muted-foreground">
          A trajetória do patrimônio e suas tendências — descritivo, sem prever o
          futuro.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
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
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Patrimônio no tempo</CardTitle>
        </CardHeader>
        <CardContent>
          <NetWorthChart data={nw.series} />
        </CardContent>
      </Card>
    </div>
  );
}
