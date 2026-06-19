import { formatBRL } from "@/core/domain/money";
import { formatMonthYear, formatTxDate } from "@/lib/format";

export interface CalendarEntry {
  id: string;
  ticker: string;
  exDate: Date;
  payDate: Date;
  perShareCents: number;
  quantity: number;
  incomeCents: number;
  monthKey: string;
}

/** Upcoming dividends as an agenda grouped by pay month. Entries arrive already
 *  sorted ascending by pay date. Display-only — no prediction (escopo §3). */
export function DividendCalendar({ entries }: { entries: CalendarEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        Nenhum dividendo futuro registrado. Cadastre as datas anunciadas (data-com e
        pagamento) para ver a agenda.
      </p>
    );
  }

  const groups: { key: string; label: string; items: CalendarEntry[] }[] = [];
  for (const entry of entries) {
    let group = groups.find((g) => g.key === entry.monthKey);
    if (!group) {
      group = { key: entry.monthKey, label: formatMonthYear(entry.payDate), items: [] };
      groups.push(group);
    }
    group.items.push(entry);
  }
  const totalCents = entries.reduce((sum, e) => sum + e.incomeCents, 0);

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.key} className="flex flex-col gap-1.5">
          <p className="text-sm font-medium capitalize">{group.label}</p>
          <ul className="divide-y divide-border">
            {group.items.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3 py-2.5 text-sm"
              >
                <div>
                  <span className="font-medium">{entry.ticker}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · com {formatTxDate(entry.exDate)} · paga {formatTxDate(entry.payDate)}
                  </span>
                </div>
                <div className="text-right tabular-nums">
                  <span className="text-muted-foreground">
                    {formatBRL(entry.perShareCents)}/cota × {entry.quantity}
                  </span>
                  <span className="ml-2 font-medium text-positive">
                    {formatBRL(entry.incomeCents)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="text-muted-foreground">Total a receber</span>
        <span className="font-medium tabular-nums text-positive">{formatBRL(totalCents)}</span>
      </div>
    </div>
  );
}
