"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  setQuoteAction,
  syncQuotesAction,
  type QuoteState,
  type SyncState,
} from "../actions";

export function QuotesCard({ assets }: { assets: { id: string; ticker: string }[] }) {
  const [quoteState, setQuote, settingQuote] = useActionState<QuoteState, FormData>(
    setQuoteAction,
    null,
  );
  const [syncState, sync, syncing] = useActionState<SyncState, FormData>(
    syncQuotesAction,
    null,
  );
  const disabled = assets.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <form action={sync} className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="outline" disabled={disabled || syncing}>
          {syncing ? "Sincronizando…" : "Atualizar via brapi"}
        </Button>
        <span className="text-xs text-muted-foreground">
          Requer BRAPI_TOKEN no .env.local; offline mantém a última cotação.
        </span>
        {syncState && syncState.ok && (
          <span className="text-sm text-positive">
            {syncState.saved} cotaç{syncState.saved === 1 ? "ão" : "ões"} atualizada
            {syncState.saved === 1 ? "" : "s"}.
          </span>
        )}
        {syncState && !syncState.ok && (
          <span className="text-sm text-destructive">{syncState.error}</span>
        )}
      </form>

      <form action={setQuote} className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Ativo</span>
          <Select name="assetId" disabled={disabled || settingQuote}>
            <SelectTrigger className="w-36">
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
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Preço manual</span>
          <Input name="price" inputMode="decimal" placeholder="9,80" className="w-28" disabled={disabled || settingQuote} />
        </label>
        <Button type="submit" variant="outline" size="sm" disabled={disabled || settingQuote}>
          {settingQuote ? "…" : "Salvar preço"}
        </Button>
        {quoteState && quoteState.ok && (
          <span className="text-sm text-positive">Preço salvo.</span>
        )}
        {quoteState && !quoteState.ok && (
          <span className="text-sm text-destructive">{quoteState.error}</span>
        )}
      </form>

      {disabled && (
        <span className="text-sm text-muted-foreground">Cadastre um ativo primeiro.</span>
      )}
    </div>
  );
}
