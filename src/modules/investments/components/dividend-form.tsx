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

import { createDividendAction, type DividendState } from "../actions";

export function DividendForm({ assets }: { assets: { id: string; ticker: string }[] }) {
  const [state, formAction, pending] = useActionState<DividendState, FormData>(
    createDividendAction,
    null,
  );
  const disabled = pending || assets.length === 0;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          <Label htmlFor="div-pershare">Valor por cota</Label>
          <Input id="div-pershare" name="perShare" inputMode="decimal" placeholder="0,10" disabled={disabled} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="div-pay">Pagamento</Label>
          <Input id="div-pay" name="payDate" type="date" disabled={disabled} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="div-ex">Data-com (opcional)</Label>
          <Input id="div-ex" name="exDate" type="date" disabled={disabled} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={disabled}>
          {pending ? "Salvando…" : "Registrar dividendo"}
        </Button>
        {assets.length === 0 && (
          <span className="text-sm text-muted-foreground">Cadastre um ativo primeiro.</span>
        )}
        {state && !state.ok && <span className="text-sm text-destructive">{state.error}</span>}
        {state && state.ok && <span className="text-sm text-positive">Dividendo registrado.</span>}
      </div>
    </form>
  );
}
