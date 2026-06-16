"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { applyRulesAction, type ApplyState } from "../actions";

export function ApplyRulesButton() {
  const [state, formAction, pending] = useActionState<ApplyState, FormData>(
    applyRulesAction,
    null,
  );

  return (
    <form action={formAction} className="flex items-center gap-3">
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Aplicando…" : "Aplicar regras às não categorizadas"}
      </Button>
      {state && (
        <span className="text-sm text-muted-foreground">
          {state.updated} transaç{state.updated === 1 ? "ão" : "ões"} categorizada
          {state.updated === 1 ? "" : "s"}.
        </span>
      )}
    </form>
  );
}
