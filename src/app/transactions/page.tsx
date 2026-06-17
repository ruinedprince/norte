import { listCategories } from "@/modules/categories/repository";
import {
  ensureDefaultCashAccount,
  listAccounts,
  listTransactions,
} from "@/modules/transactions/repository";
import { ImportForm } from "@/modules/transactions/components/import-form";
import { ManualEntryForm } from "@/modules/transactions/components/manual-entry-form";
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
  const cashAccount = await ensureDefaultCashAccount();
  const [rows, accounts, categories] = await Promise.all([
    listTransactions(200),
    listAccounts(),
    listCategories(),
  ]);

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10 reveal-stagger">
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
          <CardTitle>Novo lançamento</CardTitle>
          <CardDescription>
            Gastos e entradas sem OFX — dinheiro, cartão, Pix.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManualEntryForm
            accounts={accounts}
            categories={categories.map((category) => ({
              id: category.id,
              name: category.name,
            }))}
            today={today}
            defaultAccountId={cashAccount.id}
          />
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
