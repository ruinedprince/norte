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

import { createCategoryAction, type FormState } from "../actions";

export function CategoryForm({ parents }: { parents: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createCategoryAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cat-name">Nome</Label>
          <Input
            id="cat-name"
            name="name"
            placeholder="Alimentação"
            required
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Tipo</Label>
          <Select name="kind" defaultValue="need" disabled={pending}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="need">Necessidade</SelectItem>
              <SelectItem value="want">Desejo</SelectItem>
              <SelectItem value="saving">Poupança</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Categoria-mãe (opcional)</Label>
          <Select name="parentId" disabled={pending || parents.length === 0}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Nenhuma" />
            </SelectTrigger>
            <SelectContent>
              {parents.map((parent) => (
                <SelectItem key={parent.id} value={parent.id}>
                  {parent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Adicionar categoria"}
        </Button>
        {state && !state.ok && (
          <span className="text-sm text-destructive">{state.error}</span>
        )}
        {state && state.ok && (
          <span className="text-sm text-positive">Categoria criada.</span>
        )}
      </div>
    </form>
  );
}
