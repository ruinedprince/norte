import Link from "next/link";

import { listCategories } from "@/modules/categories/repository";
import {
  ensureDefaultCashAccount,
  listAccounts,
  listTags,
  listTransactions,
} from "@/modules/transactions/repository";
import { CsvImportForm } from "@/modules/transactions/components/csv-import-form";
import { ImportForm } from "@/modules/transactions/components/import-form";
import { ManualEntryForm } from "@/modules/transactions/components/manual-entry-form";
import { TagsManager } from "@/modules/transactions/components/tags-manager";
import { TransactionsTable } from "@/modules/transactions/components/transactions-table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Always reflect the latest database state (revalidated after each import).
export const dynamic = "force-dynamic";

export const metadata = { title: "Transações" };

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag: activeTag } = await searchParams;
  const cashAccount = await ensureDefaultCashAccount();
  const [rows, accounts, categories, tags] = await Promise.all([
    listTransactions(200, activeTag),
    listAccounts(),
    listCategories(),
    listTags(),
  ]);
  const allTags = tags.map((t) => ({ id: t.id, name: t.name }));

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
          <CardTitle>Importar CSV</CardTitle>
          <CardDescription>
            Fallback do OFX (ex.: fatura do cartão). Escolha a conta de destino.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CsvImportForm
            accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
            defaultAccountId={cashAccount.id}
          />
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
          <CardTitle>Tags</CardTitle>
          <CardDescription>
            Rótulos livres para cruzar gastos por qualquer dimensão (além da categoria).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TagsManager tags={tags} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lançamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {tags.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Filtrar:</span>
              <Badge asChild variant={activeTag ? "outline" : "default"}>
                <Link href="/transactions">Todas</Link>
              </Badge>
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  asChild
                  variant={activeTag === tag.id ? "default" : "outline"}
                >
                  <Link href={`/transactions?tag=${tag.id}`}>{tag.name}</Link>
                </Badge>
              ))}
            </div>
          )}
          <TransactionsTable rows={rows} allTags={allTags} />
        </CardContent>
      </Card>
    </div>
  );
}
