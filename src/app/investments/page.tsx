import { formatBRL } from "@/core/domain/money";
import { AllocationCard } from "@/modules/investments/components/allocation-card";
import { AssetForm } from "@/modules/investments/components/asset-form";
import { DividendForm } from "@/modules/investments/components/dividend-form";
import { InvestmentTransactionForm } from "@/modules/investments/components/investment-transaction-form";
import { PassiveIncomeChart } from "@/modules/investments/components/passive-income-chart";
import { QuotesCard } from "@/modules/investments/components/quotes-card";
import {
  listAssets,
  listDividends,
  listValuedPositions,
  monthlyPassiveIncome,
  portfolioAllocation,
  portfolioDividendYield,
} from "@/modules/investments/repository";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTxDate } from "@/lib/format";
import { cn } from "@/lib/utils";

// Always reflect the latest database state.
export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = { fii: "FII", stock: "Ação", etf: "ETF" };
const dash = (cents: number | null) => (cents == null ? "—" : formatBRL(cents));

export default async function InvestmentsPage() {
  const [positions, assets, passiveIncome, dividends, allocation, dy] =
    await Promise.all([
      listValuedPositions(),
      listAssets(),
      monthlyPassiveIncome(),
      listDividends(),
      portfolioAllocation(),
      portfolioDividendYield(),
    ]);
  const held = positions.filter((p) => p.quantity > 0);
  const investedTotal = held.reduce((sum, p) => sum + p.investedCents, 0);
  const quoted = held.filter((p) => p.marketValueCents != null);
  const marketTotal = quoted.reduce((sum, p) => sum + (p.marketValueCents ?? 0), 0);
  const gain = marketTotal - quoted.reduce((sum, p) => sum + p.investedCents, 0);
  const hasQuotes = quoted.length > 0;

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <header>
        <h1 className="font-serif text-3xl">Investimentos</h1>
        <p className="mt-1 text-muted-foreground">
          Suas posições e o valor da carteira — a base da renda passiva.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor de mercado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-serif text-4xl tabular-nums">
              {hasQuotes ? formatBRL(marketTotal) : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {quoted.length} de {held.length} posiç{held.length === 1 ? "ão" : "ões"} cotada
              {quoted.length === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total investido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-serif text-4xl tabular-nums">{formatBRL(investedTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resultado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "font-serif text-4xl tabular-nums",
                !hasQuotes ? "text-foreground" : gain >= 0 ? "text-positive" : "text-destructive",
              )}
            >
              {hasQuotes ? formatBRL(gain) : "—"}
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Posições</CardTitle>
        </CardHeader>
        <CardContent>
          {held.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma posição ainda. Cadastre um ativo e registre um aporte.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ativo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Qtd.</TableHead>
                  <TableHead className="text-right">Preço médio</TableHead>
                  <TableHead className="text-right">Preço atual</TableHead>
                  <TableHead className="text-right">Investido</TableHead>
                  <TableHead className="text-right">Valor de mercado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {held.map((position) => (
                  <TableRow key={position.assetId}>
                    <TableCell className="font-medium">
                      {position.ticker}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {position.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {KIND_LABELS[position.kind] ?? position.kind}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{position.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(position.avgCostCents)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {dash(position.currentPriceCents)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(position.investedCents)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {dash(position.marketValueCents)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alocação & rendimento</CardTitle>
          <CardDescription>Distribuição da carteira e dividend yield.</CardDescription>
        </CardHeader>
        <CardContent>
          <AllocationCard allocation={allocation} dy={dy} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Renda passiva por mês</CardTitle>
          <CardDescription>Dividendos recebidos, pelo mês de pagamento.</CardDescription>
        </CardHeader>
        <CardContent>
          <PassiveIncomeChart data={passiveIncome} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dividendos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <DividendForm assets={assets.map((a) => ({ id: a.id, ticker: a.ticker }))} />
          {dividends.length > 0 && (
            <ul className="divide-y divide-border">
              {dividends.map((dividend) => (
                <li
                  key={dividend.id}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <div>
                    <span className="font-medium">{dividend.ticker}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · pago em {formatTxDate(dividend.payDate)}
                    </span>
                  </div>
                  <div className="text-right tabular-nums">
                    <span className="text-muted-foreground">
                      {formatBRL(dividend.perShareCents)}/cota × {dividend.quantityAtPay}
                    </span>
                    <span className="ml-2 font-medium text-positive">
                      {formatBRL(dividend.incomeCents)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cotações</CardTitle>
          <CardDescription>
            Atualize via brapi ou informe um preço manualmente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuotesCard assets={assets.map((a) => ({ id: a.id, ticker: a.ticker }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nova operação</CardTitle>
          <CardDescription>Compra ou venda de um ativo.</CardDescription>
        </CardHeader>
        <CardContent>
          <InvestmentTransactionForm
            assets={assets.map((a) => ({ id: a.id, ticker: a.ticker }))}
            today={today}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Novo ativo</CardTitle>
        </CardHeader>
        <CardContent>
          <AssetForm />
        </CardContent>
      </Card>
    </div>
  );
}
