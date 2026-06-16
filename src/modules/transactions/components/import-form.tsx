"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { importOfxAction, type ImportState } from "../actions";

export function ImportForm() {
  const [state, formAction, pending] = useActionState<ImportState, FormData>(
    importOfxAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          type="file"
          name="file"
          accept=".ofx,.qfx,application/x-ofx,text/plain"
          required
          disabled={pending}
          className="sm:max-w-xs"
        />
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Importando…" : "Importar extrato OFX"}
        </Button>
      </div>

      {state && !state.ok && (
        <p className="animate-in fade-in slide-in-from-bottom-1 text-sm text-destructive duration-200">
          {state.error}
        </p>
      )}

      {state && state.ok && (
        <p className="animate-in fade-in slide-in-from-bottom-1 text-sm text-muted-foreground duration-200">
          <span className="font-medium text-positive">
            {state.result.imported} nova
            {state.result.imported === 1 ? "" : "s"}
          </span>{" "}
          de {state.result.total} · {state.result.duplicates} já existia
          {state.result.duplicates === 1 ? "" : "m"} ·{" "}
          <span className="text-foreground">{state.result.accountName}</span>
        </p>
      )}
    </form>
  );
}
