import { formatBRL } from "@/core/domain/money";
import { AccountRow } from "@/modules/accounts/components/account-row";
import { CreateAccountForm } from "@/modules/accounts/components/create-account-form";
import { listAccountsWithBalances } from "@/modules/accounts/repository";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Always reflect the latest database state (revalidated after each change).
export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const accounts = await listAccountsWithBalances();
  const patrimonio = accounts.reduce((sum, account) => sum + account.balanceCents, 0);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <header>
        <h1 className="font-serif text-3xl">Contas</h1>
        <p className="mt-1 text-muted-foreground">
          Saldos por conta — a semente do seu patrimônio.
        </p>
      </header>

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
              patrimonio < 0 ? "text-destructive" : "text-foreground",
            )}
          >
            {formatBRL(patrimonio)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Soma dos saldos atuais de {accounts.length} conta
            {accounts.length === 1 ? "" : "s"}.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suas contas</CardTitle>
          <CardDescription>
            Ajuste nome, tipo e saldo inicial. O saldo atual é o saldo inicial +
            os lançamentos da conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma conta ainda — importe um OFX ou crie uma abaixo.
            </p>
          ) : (
            accounts.map((account) => (
              <AccountRow key={account.id} account={account} />
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nova conta</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateAccountForm />
        </CardContent>
      </Card>
    </div>
  );
}
