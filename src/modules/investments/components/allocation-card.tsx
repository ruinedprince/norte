import { formatBRL } from "@/core/domain/money";
import { formatPercent, formatPercent1 } from "@/lib/format";

const KIND_LABELS: Record<string, string> = { fii: "FII", stock: "Ação", etf: "ETF" };

interface AllocationSlice {
  key: string;
  valueCents: number;
  fraction: number;
}

export function AllocationCard({
  allocation,
  dy,
}: {
  allocation: { byKind: AllocationSlice[]; byAsset: AllocationSlice[]; totalCents: number };
  dy: { annualIncomeCents: number; portfolioValueCents: number; dy: number | null };
}) {
  if (allocation.totalCents <= 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        Sem posições para alocar ainda.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted-foreground">DY da carteira (12 meses)</p>
        <p className="font-serif text-3xl tabular-nums text-positive">
          {dy.dy != null ? formatPercent1(dy.dy) : "—"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatBRL(dy.annualIncomeCents)} em 12 meses sobre {formatBRL(dy.portfolioValueCents)}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">Por tipo</p>
        {allocation.byKind.map((slice) => (
          <div key={slice.key} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between text-sm">
              <span>{KIND_LABELS[slice.key] ?? slice.key}</span>
              <span className="tabular-nums text-muted-foreground">
                {formatPercent(slice.fraction)} · {formatBRL(slice.valueCents)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.round(slice.fraction * 100)}%`,
                  background: "var(--chart-1)",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Por ativo</p>
        <ul className="divide-y divide-border">
          {allocation.byAsset.map((slice) => (
            <li key={slice.key} className="flex items-center justify-between py-1.5 text-sm">
              <span className="font-medium">{slice.key}</span>
              <span className="tabular-nums text-muted-foreground">
                {formatPercent(slice.fraction)} · {formatBRL(slice.valueCents)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
