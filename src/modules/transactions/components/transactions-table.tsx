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

import { RowTags, type TagRef } from "./row-tags";

interface TransactionRow {
  id: string;
  date: Date;
  amountCents: number;
  description: string;
  account: { name: string };
  category: { name: string } | null;
  tags: { tag: TagRef }[];
}

export function TransactionsTable({
  rows,
  allTags = [],
}: {
  rows: TransactionRow[];
  allTags?: TagRef[];
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
          const isIncome = tx.amountCents >= 0;
          return (
            <TableRow key={tx.id}>
              <TableCell className="text-muted-foreground tabular-nums">
                {formatTxDate(tx.date)}
              </TableCell>
              <TableCell className="max-w-xs truncate font-medium">
                {tx.description || "—"}
                {tx.category && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {tx.category.name}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {tx.account.name}
              </TableCell>
              <TableCell>
                <RowTags
                  transactionId={tx.id}
                  tags={tx.tags.map((t) => t.tag)}
                  allTags={allTags}
                />
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-medium tabular-nums",
                  // Money in is green; spend stays neutral (escopo §5).
                  isIncome ? "text-positive" : "text-foreground",
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
