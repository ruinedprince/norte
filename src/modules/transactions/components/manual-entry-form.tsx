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

import { createManualTransactionAction, type ManualState } from "../actions";

interface Option {
  id: string;
  name: string;
}

export function ManualEntryForm({
  accounts,
  categories,
  today,
  defaultAccountId,
}: {
  accounts: Option[];
  categories: Option[];
  today: string;
  defaultAccountId: string;
}) {
  const [state, formAction, pending] = useActionState<ManualState, FormData>(
    createManualTransactionAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label>Conta</Label>
          <Select name="accountId" defaultValue={defaultAccountId} disabled={pending}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Tipo</Label>
          <Select name="direction" defaultValue="expense" disabled={pending}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">Saída</SelectItem>
              <SelectItem value="income">Entrada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="m-amount">Valor</Label>
          <Input
            id="m-amount"
            name="amount"
            inputMode="decimal"
            placeholder="0,00"
            required
            disabled={pending}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="m-date">Data</Label>
          <Input
            id="m-date"
            name="date"
            type="date"
            defaultValue={today}
            required
            disabled={pending}
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="m-desc">Descrição</Label>
          <Input
            id="m-desc"
            name="description"
            placeholder="Mercado, almoço…"
            disabled={pending}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Categoria (opcional)</Label>
          <Select name="categoryId" disabled={pending || categories.length === 0}>
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  categories.length ? "Sem categoria" : "Crie categorias antes"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Adicionar lançamento"}
        </Button>
        {state && !state.ok && (
          <span className="text-sm text-destructive">{state.error}</span>
        )}
        {state && state.ok && (
          <span className="text-sm text-positive">Lançamento adicionado.</span>
        )}
      </div>
    </form>
  );
}
