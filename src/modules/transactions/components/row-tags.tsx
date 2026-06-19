"use client";

import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { addTransactionTagAction, removeTransactionTagAction } from "../actions";

export interface TagRef {
  id: string;
  name: string;
}

/** Inline per-row tag editor: removable chips + a compact "+ tag" picker of the
 *  tags not yet applied. Each change is a server action that revalidates. */
export function RowTags({
  transactionId,
  tags,
  allTags,
}: {
  transactionId: string;
  tags: TagRef[];
  allTags: TagRef[];
}) {
  const [pending, startTransition] = useTransition();
  const applied = new Set(tags.map((t) => t.id));
  const available = allTags.filter((t) => !applied.has(t.id));

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <Badge key={tag.id} variant="outline" className="gap-1 pr-1">
          {tag.name}
          <button
            type="button"
            aria-label={`Remover tag ${tag.name}`}
            className="rounded-full px-0.5 leading-none text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
            disabled={pending}
            onClick={() =>
              startTransition(() => removeTransactionTagAction(transactionId, tag.id))
            }
          >
            ×
          </button>
        </Badge>
      ))}
      {available.length > 0 && (
        <Select
          value=""
          disabled={pending}
          onValueChange={(tagId) =>
            startTransition(() => addTransactionTagAction(transactionId, tagId))
          }
        >
          <SelectTrigger
            size="sm"
            className="h-6 gap-1 border-dashed px-2 text-xs text-muted-foreground"
            aria-label="Adicionar tag"
          >
            <SelectValue placeholder="+ tag" />
          </SelectTrigger>
          <SelectContent>
            {available.map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                {tag.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
