import { derivePosition } from "@/core/domain/position";
import type { AssetKind, InvestmentKind, Position } from "@/core/domain/position";
import { prisma } from "@/lib/prisma";

export function listAssets() {
  return prisma.asset.findMany({ orderBy: [{ ticker: "asc" }] });
}

export function createAsset(input: { ticker: string; kind: AssetKind; name: string }) {
  return prisma.asset.create({
    data: { ticker: input.ticker.toUpperCase(), kind: input.kind, name: input.name },
  });
}

export function createInvestmentTransaction(input: {
  assetId: string;
  date: Date;
  kind: InvestmentKind;
  quantity: number;
  unitPriceCents: number;
}) {
  return prisma.investmentTransaction.create({ data: input });
}

export interface PositionRow extends Position {
  assetId: string;
  ticker: string;
  name: string;
  kind: string;
}

/** Every asset with its derived position (escopo Fase 2). */
export async function listPositions(): Promise<PositionRow[]> {
  const assets = await prisma.asset.findMany({
    include: { transactions: true },
    orderBy: [{ ticker: "asc" }],
  });

  return assets.map((asset) => {
    const position = derivePosition(
      asset.transactions.map((t) => ({
        kind: t.kind as InvestmentKind,
        quantity: t.quantity,
        unitPriceCents: t.unitPriceCents,
        date: t.date,
      })),
    );
    return {
      assetId: asset.id,
      ticker: asset.ticker,
      name: asset.name,
      kind: asset.kind,
      ...position,
    };
  });
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Store a daily quote snapshot (one per asset per day; escopo §6). */
export function saveQuote(input: { assetId: string; closeCents: number; date: Date }) {
  const date = startOfUtcDay(input.date);
  return prisma.quote.upsert({
    where: { assetId_date: { assetId: input.assetId, date } },
    create: { assetId: input.assetId, closeCents: input.closeCents, date },
    update: { closeCents: input.closeCents },
  });
}

/** The latest stored quote per asset. */
export async function latestQuoteByAsset(): Promise<
  Map<string, { closeCents: number; date: Date }>
> {
  const quotes = await prisma.quote.findMany({ orderBy: [{ date: "desc" }] });
  const map = new Map<string, { closeCents: number; date: Date }>();
  for (const quote of quotes) {
    if (!map.has(quote.assetId)) {
      map.set(quote.assetId, { closeCents: quote.closeCents, date: quote.date });
    }
  }
  return map;
}

export interface ValuedPosition extends PositionRow {
  currentPriceCents: number | null;
  marketValueCents: number | null;
  gainCents: number | null;
  quoteDate: Date | null;
}

/** Positions valued at the latest stored quote (null where no quote yet). */
export async function listValuedPositions(): Promise<ValuedPosition[]> {
  const [positions, latest] = await Promise.all([listPositions(), latestQuoteByAsset()]);
  return positions.map((position) => {
    const quote = latest.get(position.assetId);
    const marketValueCents = quote ? position.quantity * quote.closeCents : null;
    return {
      ...position,
      currentPriceCents: quote?.closeCents ?? null,
      marketValueCents,
      gainCents: marketValueCents != null ? marketValueCents - position.investedCents : null,
      quoteDate: quote?.date ?? null,
    };
  });
}
