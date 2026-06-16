"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

import { setSavingsGoalAction, type GoalState } from "../actions";

export function SavingsGoalCard({
  goalRate,
  latestRate,
  latestMonthLabel,
}: {
  goalRate: number;
  latestRate: number | null;
  latestMonthLabel: string | null;
}) {
  const [state, formAction, pending] = useActionState<GoalState, FormData>(
    setSavingsGoalAction,
    null,
  );

  const goalPercent = Math.round(goalRate * 100);
  const met = latestRate != null && latestRate >= goalRate;
  const gap = latestRate != null ? goalPercent - Math.round(latestRate * 100) : null;

  return (
    <div className="flex flex-col gap-3">
      <form action={formAction} className="flex items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Meta mensal</span>
          <div className="flex items-center gap-1.5">
            <Input
              name="percent"
              type="number"
              min={0}
              max={100}
              defaultValue={goalPercent}
              className="w-20"
              disabled={pending}
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </label>
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "…" : "Salvar"}
        </Button>
      </form>

      {state && !state.ok && (
        <span className="text-sm text-destructive">{state.error}</span>
      )}

      {latestRate != null ? (
        <p className="text-sm text-muted-foreground">
          {latestMonthLabel}:{" "}
          <span className={cn("font-medium", met ? "text-positive" : "text-foreground")}>
            {formatPercent(latestRate)}
          </span>{" "}
          {met
            ? "— atingiu a meta"
            : gap != null
              ? `— faltam ${gap} pontos`
              : ""}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Sem receita no mês para comparar.
        </p>
      )}
    </div>
  );
}
