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

import { createAssetAction, type InvestState } from "../actions";

const KINDS = [
  { value: "fii", label: "FII" },
  { value: "stock", label: "Ação" },
  { value: "etf", label: "ETF" },
];

export function AssetForm() {
  const [state, formAction, pending] = useActionState<InvestState, FormData>(
    createAssetAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ast-ticker">Ticker</Label>
          <Input
            id="ast-ticker"
            name="ticker"
            placeholder="MXRF11"
            required
            disabled={pending}
            className="uppercase"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ast-name">Nome</Label>
          <Input id="ast-name" name="name" placeholder="Maxi Renda FII" required disabled={pending} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Tipo</Label>
          <Select name="kind" defaultValue="fii" disabled={pending}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KINDS.map((k) => (
                <SelectItem key={k.value} value={k.value}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Adicionar ativo"}
        </Button>
        {state && !state.ok && <span className="text-sm text-destructive">{state.error}</span>}
        {state && state.ok && <span className="text-sm text-positive">Ativo adicionado.</span>}
      </div>
    </form>
  );
}
