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
