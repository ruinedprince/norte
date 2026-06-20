import { formatBRL } from "@/core/domain/money";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatTxDate } from "@/lib/format";

import { RowCategory, type CategoryRef } from "./row-category";
import { RowTags, type TagRef } from "./row-tags";

interface TransactionRow {
  id: string;
  date: Date;
  amountCents: number;
  type: string;
  description: string;
  categoryId: string | null;
  account: { name: string };
  category: { name: string } | null;
  tags: { tag: TagRef }[];
}

export function TransactionsTable({
  rows,
  allTags = [],
  categories = [],
}: {
  rows: TransactionRow[];
  allTags?: TagRef[];
  categories?: CategoryRef[];
}) {
  if (rows.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Nenhuma transação ainda. Importe um extrato OFX para começar.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-20">Data</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Conta</TableHead>
          <TableHead>Tags</TableHead>
          <TableHead className="text-right">Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((tx) => {
          const isTransfer = tx.type === "transfer";
          const isIncome = tx.amountCents >= 0;
          return (
            <TableRow key={tx.id}>
              <TableCell className="text-muted-foreground tabular-nums align-top">
                {formatTxDate(tx.date)}
              </TableCell>
              <TableCell className="max-w-xs align-top">
                <div className="truncate font-medium">{tx.description || "—"}</div>
                <RowCategory
                  transactionId={tx.id}
                  categoryId={tx.categoryId}
                  categoryName={tx.category?.name ?? null}
                  isTransfer={isTransfer}
                  categories={categories}
                />
              </TableCell>
              <TableCell className="align-top text-muted-foreground">
                {tx.account.name}
              </TableCell>
              <TableCell className="align-top">
                <RowTags
                  transactionId={tx.id}
                  tags={tx.tags.map((t) => t.tag)}
                  allTags={allTags}
                />
              </TableCell>
              <TableCell
                className={cn(
                  "text-right align-top font-medium tabular-nums",
                  // Money in is green; spend neutral; a transfer is out of the
                  // cash flow, so it reads muted (escopo §5).
                  isTransfer
                    ? "text-muted-foreground"
                    : isIncome
                      ? "text-positive"
                      : "text-foreground",
                )}
              >
                {formatBRL(tx.amountCents)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
