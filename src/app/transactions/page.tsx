import Link from "next/link";

import { listCategories } from "@/modules/categories/repository";
import {
  ensureDefaultCashAccount,
  listAccounts,
  listTags,
  listTransactionsPage,
} from "@/modules/transactions/repository";
import { CsvImportForm } from "@/modules/transactions/components/csv-import-form";
import { ImportForm } from "@/modules/transactions/components/import-form";
import { ManualEntryForm } from "@/modules/transactions/components/manual-entry-form";
import { TagsManager } from "@/modules/transactions/components/tags-manager";
import { TransactionsTable } from "@/modules/transactions/components/transactions-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  searchParams: Promise<{ tag?: string; q?: string; page?: string }>;
}) {
  const { tag: activeTag, q, page: pageParam } = await searchParams;
  const query = (q ?? "").trim();
  const page = Math.max(1, Number(pageParam) || 1);

  const cashAccount = await ensureDefaultCashAccount();
  const [result, accounts, categories, tags] = await Promise.all([
    listTransactionsPage({ query, tagId: activeTag, page }),
    listAccounts(),
    listCategories(),
    listTags(),
  ]);
  const { rows, total, pageCount } = result;
  const allTags = tags.map((t) => ({ id: t.id, name: t.name }));
  const allCategories = categories.map((c) => ({ id: c.id, name: c.name }));

  // Build a /transactions href preserving the current q + tag, overriding any of
  // tag (null = clear) / q / page.
  const hrefWith = (over: { tag?: string | null; q?: string; page?: number }) => {
    const sp = new URLSearchParams();
    const tag = over.tag === undefined ? activeTag : over.tag;
    const qq = over.q === undefined ? query : over.q;
    const pg = over.page ?? 1;
    if (tag) sp.set("tag", tag);
    if (qq) sp.set("q", qq);
    if (pg > 1) sp.set("page", String(pg));
    const s = sp.toString();
    return s ? `/transactions?${s}` : "/transactions";
  };

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
          <form method="GET" action="/transactions" className="mb-4 flex flex-wrap items-center gap-2">
            {activeTag && <input type="hidden" name="tag" value={activeTag} />}
            <Input
              name="q"
              defaultValue={query}
              placeholder="Buscar na descrição…"
              className="w-full sm:max-w-xs"
            />
            <Button type="submit" variant="outline" size="sm">
              Buscar
            </Button>
            {query && (
              <Badge asChild variant="outline">
                <Link href={hrefWith({ q: "" })}>Limpar busca</Link>
              </Badge>
            )}
          </form>

          {tags.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Filtrar:</span>
              <Badge asChild variant={activeTag ? "outline" : "default"}>
                <Link href={hrefWith({ tag: null })}>Todas</Link>
              </Badge>
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  asChild
                  variant={activeTag === tag.id ? "default" : "outline"}
                >
                  <Link href={hrefWith({ tag: tag.id })}>{tag.name}</Link>
                </Badge>
              ))}
            </div>
          )}

          {rows.length === 0 && (query || activeTag) ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum lançamento para essa busca/filtro.
            </p>
          ) : (
            <TransactionsTable rows={rows} allTags={allTags} categories={allCategories} />
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">
              {total} lançamento{total === 1 ? "" : "s"}
            </span>
            {pageCount > 1 && (
              <div className="flex items-center gap-2">
                {page > 1 ? (
                  <Badge asChild variant="outline">
                    <Link href={hrefWith({ page: page - 1 })}>← Anterior</Link>
                  </Badge>
                ) : (
                  <span className="text-muted-foreground/40">← Anterior</span>
                )}
                <span className="text-muted-foreground">
                  Página {page} de {pageCount}
                </span>
                {page < pageCount ? (
                  <Badge asChild variant="outline">
                    <Link href={hrefWith({ page: page + 1 })}>Próxima →</Link>
                  </Badge>
                ) : (
                  <span className="text-muted-foreground/40">Próxima →</span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
