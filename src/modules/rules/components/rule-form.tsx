"use client";

import { useActionState } from "react";

import { RULE_METRICS } from "@/core/domain/rules";
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

import { createRuleAction, type RuleState } from "../actions";

export function RuleForm() {
  const [state, formAction, pending] = useActionState<RuleState, FormData>(
    createRuleAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rule-name">Nome</Label>
          <Input id="rule-name" name="name" placeholder="Poupança baixa" required disabled={pending} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Métrica</Label>
          <Select name="metric" defaultValue="savingsRate" disabled={pending}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RULE_METRICS.map((m) => (
                <SelectItem key={m.key} value={m.key}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Quando estiver</Label>
          <Select name="comparator" defaultValue="below" disabled={pending}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="below">Abaixo de</SelectItem>
              <SelectItem value="above">Acima de</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rule-threshold">Limiar</Label>
          <Input id="rule-threshold" name="threshold" inputMode="decimal" placeholder="20" disabled={pending} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Adicionar regra"}
        </Button>
        <span className="text-xs text-muted-foreground">
          % para taxa/DY · R$ para gasto/patrimônio
        </span>
        {state && !state.ok && <span className="text-sm text-destructive">{state.error}</span>}
        {state && state.ok && <span className="text-sm text-positive">Regra criada.</span>}
      </div>
    </form>
  );
}
