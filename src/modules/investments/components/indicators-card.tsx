"use client";

import { useActionState } from "react";

import { formatBRL } from "@/core/domain/money";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPercent1 } from "@/lib/format";

import { setAssetBookValueAction, type BookValueState } from "../actions";

export interface IndicatorRow {
  assetId: string;
  ticker: string;
  kind: string;
  currentPriceCents: number | null;
  bookValuePerShareCents: number | null;
  priceToBook: number | null;
  dividendYield: number | null;
}

const dash = (cents: number | null) => (cents == null ? "—" : formatBRL(cents));

/** "0,92" — P/VP as a plain ratio (comma decimal), no color or signal. */
function formatRatio(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

/** A neutral statement of fact about where the price sits vs book value.
 *  Never advice — escopo §3 forbids any investment recommendation. */
function bookHint(pvp: number): string {
  if (pvp < 1) return "abaixo do VP";
  if (pvp > 1) return "acima do VP";
  return "no VP";
}

export function IndicatorsCard({
  rows,
  assets,
}: {
  rows: IndicatorRow[];
  assets: { id: string; ticker: string }[];
}) {
  const [state, setBookValue, saving] = useActionState<BookValueState, FormData>(
    setAssetBookValueAction,
    null,
  );
  const disabled = assets.length === 0;

  return (
    <div className="flex flex-col gap-4">
      {rows.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">
          Sem posições para indicar ainda.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right">Preço atual</TableHead>
              <TableHead className="text-right">VPA</TableHead>
              <TableHead className="text-right">P/VP</TableHead>
              <TableHead className="text-right">DY (12m)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.assetId}>
                <TableCell className="font-medium">{row.ticker}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {dash(row.currentPriceCents)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {dash(row.bookValuePerShareCents)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.priceToBook == null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <span>
                      {formatRatio(row.priceToBook)}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {bookHint(row.priceToBook)}
                      </span>
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.dividendYield == null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    formatPercent1(row.dividendYield)
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <form
        action={setBookValue}
        className="flex flex-wrap items-end gap-3 border-t border-border pt-4"
      >
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Ativo</span>
          <Select name="assetId" disabled={disabled || saving}>
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
          <span className="text-xs text-muted-foreground">VPA (valor patrimonial/cota)</span>
          <Input
            name="bookValue"
            inputMode="decimal"
            placeholder="10,15"
            className="w-32"
            disabled={disabled || saving}
          />
        </label>
        <Button type="submit" variant="outline" size="sm" disabled={disabled || saving}>
          {saving ? "…" : "Salvar VPA"}
        </Button>
        {state && state.ok && <span className="text-sm text-positive">VPA salvo.</span>}
        {state && !state.ok && <span className="text-sm text-destructive">{state.error}</span>}
        {disabled && (
          <span className="text-sm text-muted-foreground">Cadastre um ativo primeiro.</span>
        )}
      </form>

      <p className="text-xs text-muted-foreground">
        P/VP e DY são descritivos — fotografam o preço atual, não são recomendação.
      </p>
    </div>
  );
}
