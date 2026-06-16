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

import { ACCOUNT_TYPE_OPTIONS } from "../account-types";
import { createAccountAction, type AccountFormState } from "../actions";

export function CreateAccountForm() {
  const [state, formAction, pending] = useActionState<AccountFormState, FormData>(
    createAccountAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="acc-name">Nome</Label>
          <Input id="acc-name" name="name" placeholder="Nubank" required disabled={pending} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Tipo</Label>
          <Select name="type" defaultValue="checking" disabled={pending}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACCOUNT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="acc-opening">Saldo inicial</Label>
          <Input
            id="acc-opening"
            name="openingBalance"
            inputMode="decimal"
            placeholder="0,00"
            disabled={pending}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Adicionar conta"}
        </Button>
        {state && !state.ok && (
          <span className="text-sm text-destructive">{state.error}</span>
        )}
        {state && state.ok && (
          <span className="text-sm text-positive">Conta criada.</span>
        )}
      </div>
    </form>
  );
}
