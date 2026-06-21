"use client";

import { useActionState } from "react";

import { setTargetAllocationAction, type AllocState } from "@/modules/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const KIND_LABELS: Record<string, string> = { fii: "FII", stock: "Ação", etf: "ETF" };
const KINDS = ["fii", "stock", "etf"] as const;
const TOLERANCE_PP = 5;

export interface TargetRow {
  key: string;
  currentPct: number;
  targetPct: number;
  gapPp: number;
}

export function TargetAllocationCard({
  rows,
  targets,
  hasPositions,
}: {
  rows: TargetRow[];
  targets: Record<string, number>;
  hasPositions: boolean;
}) {
  const [state, formAction, pending] = useActionState<AllocState, FormData>(
    setTargetAllocationAction,
    null,
  );
  const hasPlan = Object.keys(targets).length > 0;
  const sum = Object.values(targets).reduce((s, v) => s + v, 0);

  return (
    <div className="flex flex-col gap-5">
      {hasPlan ? (
        <div className="flex flex-col gap-2">
          {rows.map((row) => {
            const within = Math.abs(row.gapPp) <= TOLERANCE_PP;
            return (
              <div key={row.key} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">{KIND_LABELS[row.key] ?? row.key}</span>
                <span className="tabular-nums text-muted-foreground">
                  {hasPositions ? `${Math.round(row.currentPct)}%` : "—"} atual · alvo{" "}
                  {Math.round(row.targetPct)}%
                  {hasPositions && row.targetPct > 0 && (
                    <span className={cn("ml-2", within ? "text-muted-foreground" : "text-destructive")}>
                      {within
                        ? "no alvo"
                        : `${row.gapPp > 0 ? "+" : ""}${Math.round(row.gapPp)} pp`}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
          {Math.round(sum) !== 100 && (
            <p className="text-xs text-muted-foreground">
              Seu plano soma {Math.round(sum)}% (o ideal é 100%).
            </p>
          )}
          {!hasPositions && (
            <p className="text-xs text-muted-foreground">
              Cadastre posições pra comparar com o alvo.
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Defina seu plano de alocação abaixo — o Norte mostra o quanto você está dentro
          ou fora dele (não recomenda o que comprar).
        </p>
      )}

      <form action={formAction} className="flex flex-col gap-3 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">Alvo por tipo (%)</p>
        <div className="flex flex-wrap items-end gap-3">
          {KINDS.map((kind) => (
            <label key={kind} className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{KIND_LABELS[kind]}</span>
              <Input
                name={kind}
                inputMode="decimal"
                defaultValue={targets[kind] ? String(targets[kind]) : ""}
                placeholder="0"
                className="w-20"
                disabled={pending}
              />
            </label>
          ))}
          <Button type="submit" variant="outline" size="sm" disabled={pending}>
            {pending ? "Salvando…" : "Salvar plano"}
          </Button>
        </div>
        {state && state.ok && <span className="text-sm text-positive">Plano salvo.</span>}
        {state && !state.ok && <span className="text-sm text-destructive">{state.error}</span>}
      </form>
    </div>
  );
}
