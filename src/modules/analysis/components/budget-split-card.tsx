import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

interface BudgetSplit {
  month: string;
  incomeCents: number;
  needsCents: number;
  wantsCents: number;
  savedCents: number;
}

function ratio(part: number, whole: number): number {
  return whole > 0 ? part / whole : 0;
}

/** Descriptive 50/30/20 of the month's income (escopo Fase 1 [Could]). Needs and
 *  wants are caps (lower is fine); savings is a floor (higher is fine). */
export function BudgetSplitCard({ split }: { split: BudgetSplit | null }) {
  if (!split || split.incomeCents <= 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        Sem receita no mês para calcular o 50/30/20.
      </p>
    );
  }

  const rows = [
    { label: "Necessidades", actual: ratio(split.needsCents, split.incomeCents), target: 0.5, mode: "cap" as const },
    { label: "Desejos", actual: ratio(split.wantsCents, split.incomeCents), target: 0.3, mode: "cap" as const },
    { label: "Poupança", actual: ratio(split.savedCents, split.incomeCents), target: 0.2, mode: "floor" as const },
  ];

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row) => {
        const ok = row.mode === "cap" ? row.actual <= row.target : row.actual >= row.target;
        const width = Math.max(0, Math.min(100, Math.round(row.actual * 100)));
        return (
          <div key={row.label} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium">{row.label}</span>
              <span className="text-muted-foreground">
                <span className={cn("font-medium", ok ? "text-positive" : "text-destructive")}>
                  {formatPercent(row.actual)}
                </span>{" "}
                · alvo {formatPercent(row.target)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{ width: `${width}%`, background: "var(--chart-1)" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
