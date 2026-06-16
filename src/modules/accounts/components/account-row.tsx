"use client";

import { formatBRL } from "@/core/domain/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { centsToAmountInput } from "@/lib/format";
import { cn } from "@/lib/utils";

import { ACCOUNT_TYPE_OPTIONS } from "../account-types";
import { updateAccountAction } from "../actions";

interface Props {
  account: {
    id: string;
    name: string;
    type: string;
    openingBalanceCents: number;
    balanceCents: number;
    txCount: number;
  };
}

export function AccountRow({ account }: Props) {
  return (
    <form
      action={updateAccountAction}
      className="flex flex-wrap items-end gap-3 border-b border-border py-3 last:border-0"
    >
      <input type="hidden" name="id" value={account.id} />

      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Nome</span>
        <Input name="name" defaultValue={account.name} className="w-44" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Tipo</span>
        <Select name="type" defaultValue={account.type}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACCOUNT_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Saldo inicial</span>
        <Input
          name="openingBalance"
          defaultValue={centsToAmountInput(account.openingBalanceCents)}
          inputMode="decimal"
          className="w-32"
        />
      </label>

      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">Saldo atual</span>
        <span
          className={cn(
            "font-medium tabular-nums",
            account.balanceCents < 0 ? "text-destructive" : "text-foreground",
          )}
        >
          {formatBRL(account.balanceCents)}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {account.txCount} lanç.
        </span>
      </div>

      <Button type="submit" variant="outline" size="sm">
        Salvar
      </Button>
    </form>
  );
}
