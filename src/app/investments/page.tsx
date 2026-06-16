import { formatBRL } from "@/core/domain/money";
import { AssetForm } from "@/modules/investments/components/asset-form";
import { InvestmentTransactionForm } from "@/modules/investments/components/investment-transaction-form";
import { listAssets, listPositions } from "@/modules/investments/repository";
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

// Always reflect the latest database state.
export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = { fii: "FII", stock: "Ação", etf: "ETF" };

export default async function InvestmentsPage() {
  const [positions, assets] = await Promise.all([listPositions(), listAssets()]);
  const held = positions.filter((p) => p.quantity > 0);
  const totalInvested = held.reduce((sum, p) => sum + p.investedCents, 0);

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <header>
        <h1 className="font-serif text-3xl">Investimentos</h1>
        <p className="mt-1 text-muted-foreground">
          Suas posições e aportes — a base da renda passiva.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total investido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-serif text-4xl tabular-nums">{formatBRL(totalInvested)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Custo das {held.length} posiç{held.length === 1 ? "ão" : "ões"} em carteira.
          </p>
        </CardContent>
      </Card>

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
                  <TableHead className="text-right">Investido</TableHead>
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
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(position.investedCents)}
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
