"use client";

import { useActionState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { createTagAction, deleteTagAction, type TagState } from "../actions";

export interface TagSummary {
  id: string;
  name: string;
  _count: { transactions: number };
}

export function TagsManager({ tags }: { tags: TagSummary[] }) {
  const [state, create, creating] = useActionState<TagState, FormData>(createTagAction, null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <form action={create} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Nova tag</span>
          <Input name="name" placeholder="ex.: Viagem" className="w-44" disabled={creating} />
        </label>
        <Button type="submit" variant="outline" size="sm" disabled={creating}>
          {creating ? "…" : "Criar tag"}
        </Button>
        {state && !state.ok && <span className="text-sm text-destructive">{state.error}</span>}
      </form>

      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="gap-1.5 pr-1">
              {tag.name}
              <span className="text-muted-foreground tabular-nums">{tag._count.transactions}</span>
              <button
                type="button"
                aria-label={`Excluir tag ${tag.name}`}
                className="rounded-full px-1 leading-none text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                disabled={pending}
                onClick={() => startTransition(() => deleteTagAction(tag.id))}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhuma tag ainda.</p>
      )}
    </div>
  );
}
