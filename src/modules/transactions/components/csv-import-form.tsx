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

import { importCsvAction, type CsvImportState } from "../actions";

export function CsvImportForm({
  accounts,
  defaultAccountId,
}: {
  accounts: { id: string; name: string }[];
  defaultAccountId?: string;
}) {
  const [state, formAction, pending] = useActionState<CsvImportState, FormData>(
    importCsvAction,
    null,
  );
  const disabled = pending || accounts.length === 0;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="csv-file">Arquivo CSV</Label>
          <Input
            id="csv-file"
            type="file"
            name="file"
            accept=".csv,text/csv,text/plain"
            required
            disabled={disabled}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Conta de destino</Label>
          <Select
            name="accountId"
            defaultValue={defaultAccountId ?? accounts[0]?.id}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Conta" />
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
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={disabled}>
          {pending ? "Importando…" : "Importar CSV"}
        </Button>
        {accounts.length === 0 && (
          <span className="text-sm text-muted-foreground">Cadastre uma conta primeiro.</span>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Espera um cabeçalho com colunas de <strong>data</strong>, <strong>descrição</strong> e{" "}
        <strong>valor</strong>. Valores com sinal (saída negativa); datas DD/MM/AAAA. Dedup pela
        data + valor + descrição — reimportar o mesmo arquivo não duplica.
      </p>

      {state && !state.ok && (
        <p className="animate-in fade-in slide-in-from-bottom-1 text-sm text-destructive duration-200">
          {state.error}
        </p>
      )}

      {state && state.ok && (
        <p className="animate-in fade-in slide-in-from-bottom-1 text-sm text-muted-foreground duration-200">
          <span className="font-medium text-positive">
            {state.result.imported} nova{state.result.imported === 1 ? "" : "s"}
          </span>{" "}
          de {state.result.total} · {state.result.duplicates} já existia
          {state.result.duplicates === 1 ? "" : "m"} ·{" "}
          <span className="text-foreground">{state.result.accountName}</span>
        </p>
      )}
    </form>
  );
}
