import type { AccountType } from "@/core/domain/transaction";
import { prisma } from "@/lib/prisma";

export interface AccountWithBalance {
  id: string;
  name: string;
  type: string;
  openingBalanceCents: number;
  /** Opening balance + the sum of the account's transactions. */
  balanceCents: number;
  txCount: number;
}

/** Accounts with their current balance (escopo Fase 1: contas & saldos). */
export async function listAccountsWithBalances(): Promise<AccountWithBalance[]> {
  const accounts = await prisma.account.findMany({ orderBy: [{ createdAt: "asc" }] });
  const grouped = await prisma.transaction.groupBy({
    by: ["accountId"],
    _sum: { amountCents: true },
    _count: { _all: true },
  });
  const byId = new Map(grouped.map((g) => [g.accountId, g]));

  return accounts.map((account) => {
    const g = byId.get(account.id);
    return {
      id: account.id,
      name: account.name,
      type: account.type,
      openingBalanceCents: account.openingBalanceCents,
      balanceCents: account.openingBalanceCents + (g?._sum.amountCents ?? 0),
      txCount: g?._count._all ?? 0,
    };
  });
}

export function createAccount(input: {
  name: string;
  type: AccountType;
  openingBalanceCents: number;
}) {
  return prisma.account.create({
    data: {
      name: input.name,
      type: input.type,
      openingBalanceCents: input.openingBalanceCents,
      currency: "BRL",
    },
  });
}

export function updateAccount(input: {
  id: string;
  name: string;
  type: AccountType;
  openingBalanceCents: number;
}) {
  return prisma.account.update({
    where: { id: input.id },
    data: {
      name: input.name,
      type: input.type,
      openingBalanceCents: input.openingBalanceCents,
    },
  });
}
