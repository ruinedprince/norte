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

import { createRuleAction, type FormState } from "../actions";

export function RuleForm({ categories }: { categories: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createRuleAction,
    null,
  );
  const noCategories = categories.length === 0;
  const disabled = pending || noCategories;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rule-matcher">Quando a descrição contém</Label>
          <Input
            id="rule-matcher"
            name="matcher"
            placeholder="iFood"
            required
            disabled={disabled}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Categoria</Label>
          <Select name="categoryId" disabled={disabled}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Escolha…" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rule-priority">Prioridade</Label>
          <Input
            id="rule-priority"
            name="priority"
            type="number"
            defaultValue={0}
            className="w-24"
            disabled={disabled}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={disabled}>
          {pending ? "Salvando…" : "Adicionar regra"}
        </Button>
        {noCategories && (
          <span className="text-sm text-muted-foreground">
            Crie uma categoria primeiro.
          </span>
        )}
        {state && !state.ok && (
          <span className="text-sm text-destructive">{state.error}</span>
        )}
        {state && state.ok && (
          <span className="text-sm text-positive">Regra criada.</span>
        )}
      </div>
    </form>
  );
}
