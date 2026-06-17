"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createInvestmentTransactionAction, type InvestState } from "../actions";

export function InvestmentTransactionForm({
  assets,
  accounts,
  today,
}: {
  assets: { id: string; ticker: string }[];
  accounts: { id: string; name: string }[];
  today: string;
}) {
  const [state, formAction, pending] = useActionState<InvestState, FormData>(
    createInvestmentTransactionAction,
    null,
  );
  const disabled = pending || assets.length === 0;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label>Ativo</Label>
          <Select name="assetId" disabled={disabled}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Ativo" />
            </SelectTrigger>
            <SelectContent>
              {assets.map((asset) => (
                <SelectItem key={asset.id} value={asset.id}>
                  {asset.ticker}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Operação</Label>
          <Select name="kind" defaultValue="buy" disabled={disabled}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="buy">Compra</SelectItem>
              <SelectItem value="sell">Venda</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="inv-qty">Quantidade</Label>
          <Input id="inv-qty" name="quantity" type="number" min={1} step={1} placeholder="10" disabled={disabled} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="inv-price">Preço unitário</Label>
          <Input id="inv-price" name="unitPrice" inputMode="decimal" placeholder="9,80" disabled={disabled} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="inv-date">Data</Label>
          <Input id="inv-date" name="date" type="date" defaultValue={today} disabled={disabled} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Conta (caixa)</Label>
          <Select name="accountId" defaultValue={accounts[0]?.id ?? "none"} disabled={disabled}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={disabled}>
          {pending ? "Salvando…" : "Registrar operação"}
        </Button>
        {assets.length === 0 && (
          <span className="text-sm text-muted-foreground">Cadastre um ativo primeiro.</span>
        )}
        {state && !state.ok && <span className="text-sm text-destructive">{state.error}</span>}
        {state && state.ok && <span className="text-sm text-positive">Operação registrada.</span>}
      </div>
    </form>
  );
}
