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
import { cn } from "@/lib/utils";

import { setTransactionCategoryAction, setTransactionTransferAction } from "../actions";

export interface CategoryRef {
  id: string;
  name: string;
}

/** Inline per-row category override + transfer toggle. Editable only when a
 *  category list is provided; otherwise read-only (e.g. the dashboard list). */
export function RowCategory({
  transactionId,
  categoryId,
  categoryName,
  isTransfer,
  categories,
}: {
  transactionId: string;
  categoryId: string | null;
  categoryName: string | null;
  isTransfer: boolean;
  categories: CategoryRef[];
}) {
  const [pending, start] = useTransition();

  if (categories.length === 0) {
    // Read-only: just the labels.
    if (!categoryName && !isTransfer) return null;
    return (
      <span className="ml-2 inline-flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
        {isTransfer && <Badge variant="outline">transferência</Badge>}
        {categoryName}
      </span>
    );
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5">
      <Select
        value={categoryId ?? "none"}
        disabled={pending}
        onValueChange={(value) =>
          start(() =>
            setTransactionCategoryAction(transactionId, value === "none" ? null : value),
          )
        }
      >
        <SelectTrigger
          size="sm"
          className="h-6 w-auto gap-1 px-2 text-xs font-normal text-muted-foreground"
          aria-label="Categoria"
        >
          <SelectValue placeholder="categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Sem categoria</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <button
        type="button"
        disabled={pending}
        aria-pressed={isTransfer}
        title="Transferência fica fora de receita/despesa"
        onClick={() => start(() => setTransactionTransferAction(transactionId, !isTransfer))}
        className={cn(
          "rounded-full border px-2 py-0.5 text-xs leading-none transition-colors disabled:opacity-50",
          isTransfer
            ? "border-transparent bg-secondary text-secondary-foreground"
            : "border-dashed border-border text-muted-foreground hover:text-foreground",
        )}
      >
        {isTransfer ? "↔ transferência" : "↔ transf."}
      </button>
    </div>
  );
}
