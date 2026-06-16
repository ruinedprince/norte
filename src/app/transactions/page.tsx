import { listTransactions } from "@/modules/transactions/repository";
import { ImportForm } from "@/modules/transactions/components/import-form";
import { TransactionsTable } from "@/modules/transactions/components/transactions-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Always reflect the latest database state (revalidated after each import).
export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const rows = await listTransactions(200);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <header>
        <h1 className="font-serif text-3xl">Transações</h1>
        <p className="mt-1 text-muted-foreground">
          Importe extratos OFX e acompanhe seus lançamentos.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Importar extrato</CardTitle>
          <CardDescription>
            Aceita OFX do Inter (e outros bancos). A importação é idempotente —
            reenviar o mesmo arquivo não duplica nada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImportForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lançamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionsTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
