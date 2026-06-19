import { priceToBook, trailingDividendYield } from "@/core/domain/indicators";
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

/** Set an asset's latest book value per share (VPA), integer cents — the input
 *  for the descriptive P/VP indicator (escopo Fase 2 [Could]). */
export function setAssetBookValue(assetId: string, bookValuePerShareCents: number) {
  return prisma.asset.update({
    where: { id: assetId },
    data: { bookValuePerShareCents },
  });
}

/**
 * Record a buy/sell. When `accountId` is given, also writes the paired cash leg
 * (escopo §4 aporte↔caixa): a `transfer` that debits the account on a buy and
 * credits it on a sell, so the money leaves/enters the cash side and the
 * patrimônio is not double-counted. Transfers are excluded from income/expense.
 */
export function createInvestmentTransaction(input: {
  assetId: string;
  date: Date;
  kind: InvestmentKind;
  quantity: number;
  unitPriceCents: number;
  accountId?: string | null;
}) {
  const { accountId, ...investment } = input;
  const totalCents = input.quantity * input.unitPriceCents;

  return prisma.$transaction(async (tx) => {
    const created = await tx.investmentTransaction.create({
      data: { ...investment, accountId: accountId ?? null },
    });
    if (accountId) {
      await tx.transaction.create({
        data: {
          accountId,
          date: input.date,
          amountCents: input.kind === "buy" ? -totalCents : totalCents,
          type: "transfer",
          description:
            input.kind === "buy" ? "Aporte (investimento)" : "Resgate (investimento)",
          source: "manual",
          dedupKey: `invtransfer:${crypto.randomUUID()}`,
          transferGroupId: created.id,
        },
      });
    }
    return created;
  });
}

export interface PositionRow extends Position {
  assetId: string;
  ticker: string;
  name: string;
  kind: string;
  /** Latest user-entered book value per share (VPA), cents — null if unset. */
  bookValuePerShareCents: number | null;
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
      bookValuePerShareCents: asset.bookValuePerShareCents,
      ...position,
    };
  });
}

/** Sum of per-share dividends paid since `cutoff`, per assetId — the trailing
 *  numerator for each asset's dividend yield. */
async function trailingPerShareByAsset(cutoff: Date): Promise<Map<string, number>> {
  const rows = await prisma.dividend.findMany({
    where: { payDate: { gte: cutoff } },
    select: { assetId: true, perShareCents: true },
  });
  const byAsset = new Map<string, number>();
  for (const row of rows) {
    byAsset.set(row.assetId, (byAsset.get(row.assetId) ?? 0) + row.perShareCents);
  }
  return byAsset;
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
  /** P/VP: current price over book value per share — null when either is unset. */
  priceToBook: number | null;
  /** Trailing-12m dividend yield for this asset — null when there is no price. */
  dividendYield: number | null;
}

/** Positions valued at the latest stored quote, with the descriptive P/VP and
 *  trailing-12m dividend yield per asset (null where the inputs are missing). */
export async function listValuedPositions(): Promise<ValuedPosition[]> {
  const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const [positions, latest, trailingDiv] = await Promise.all([
    listPositions(),
    latestQuoteByAsset(),
    trailingPerShareByAsset(cutoff),
  ]);
  return positions.map((position) => {
    const quote = latest.get(position.assetId);
    const currentPriceCents = quote?.closeCents ?? null;
    const marketValueCents = quote ? position.quantity * quote.closeCents : null;
    return {
      ...position,
      currentPriceCents,
      marketValueCents,
      gainCents: marketValueCents != null ? marketValueCents - position.investedCents : null,
      quoteDate: quote?.date ?? null,
      priceToBook: priceToBook(currentPriceCents, position.bookValuePerShareCents),
      dividendYield: trailingDividendYield(
        trailingDiv.get(position.assetId) ?? 0,
        currentPriceCents,
      ),
    };
  });
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function quantityHeldAt(
  txns: { kind: string; quantity: number; unitPriceCents: number; date: Date }[],
  date: Date,
): number {
  return derivePosition(
    txns
      .filter((t) => t.date.getTime() <= date.getTime())
      .map((t) => ({
        kind: t.kind as InvestmentKind,
        quantity: t.quantity,
        unitPriceCents: t.unitPriceCents,
        date: t.date,
      })),
  ).quantity;
}

export function createDividend(input: {
  assetId: string;
  exDate: Date;
  payDate: Date;
  perShareCents: number;
}) {
  return prisma.dividend.create({ data: input });
}

export interface DividendRow {
  id: string;
  ticker: string;
  exDate: Date;
  payDate: Date;
  perShareCents: number;
  quantityAtPay: number;
  incomeCents: number;
}

/** Dividend history, newest pay date first, with the income it generated
 *  (per-share × quantity held at the pay date). */
export async function listDividends(): Promise<DividendRow[]> {
  const dividends = await prisma.dividend.findMany({
    include: { asset: { include: { transactions: true } } },
    orderBy: [{ payDate: "desc" }],
  });
  return dividends.map((dividend) => {
    const quantityAtPay = quantityHeldAt(dividend.asset.transactions, dividend.payDate);
    return {
      id: dividend.id,
      ticker: dividend.asset.ticker,
      exDate: dividend.exDate,
      payDate: dividend.payDate,
      perShareCents: dividend.perShareCents,
      quantityAtPay,
      incomeCents: dividend.perShareCents * quantityAtPay,
    };
  });
}

export interface PassiveIncomePoint {
  month: string;
  incomeCents: number;
}

/** Passive income per "YYYY-MM" (by pay date), oldest first (escopo Fase 2). */
export async function monthlyPassiveIncome(): Promise<PassiveIncomePoint[]> {
  const rows = await listDividends();
  const byMonth = new Map<string, number>();
  for (const row of rows) {
    if (row.incomeCents <= 0) continue;
    const key = monthKey(row.payDate);
    byMonth.set(key, (byMonth.get(key) ?? 0) + row.incomeCents);
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, incomeCents]) => ({ month, incomeCents }));
}

export interface DividendCalendarEntry {
  id: string;
  ticker: string;
  exDate: Date;
  payDate: Date;
  perShareCents: number;
  /** Quantity held as of the pay date (current holding for future dates). */
  quantity: number;
  /** Expected income = quantity × per-share. */
  incomeCents: number;
  /** Pay month "YYYY-MM", for grouping the agenda. */
  monthKey: string;
}

/**
 * Upcoming dividends (pay date today or later), earliest first — the calendar /
 * agenda view (escopo Fase 2 [Must]). These are scheduled events the user has
 * recorded, not a forecast: the income is just the recorded per-share times the
 * quantity held. Reuses listDividends so the quantity logic stays in one place.
 */
export async function dividendCalendar(): Promise<DividendCalendarEntry[]> {
  const today = startOfUtcDay(new Date());
  return (await listDividends())
    .filter((d) => d.payDate.getTime() >= today.getTime())
    .sort((a, b) => a.payDate.getTime() - b.payDate.getTime())
    .map((d) => ({
      id: d.id,
      ticker: d.ticker,
      exDate: d.exDate,
      payDate: d.payDate,
      perShareCents: d.perShareCents,
      quantity: d.quantityAtPay,
      incomeCents: d.incomeCents,
      monthKey: monthKey(d.payDate),
    }));
}

export interface AllocationSlice {
  key: string; // ticker or kind
  valueCents: number;
  fraction: number;
}

export interface PortfolioAllocation {
  byKind: AllocationSlice[];
  byAsset: AllocationSlice[];
  totalCents: number;
}

/** Allocation of the portfolio by kind and by asset (escopo Fase 2 [Should]),
 *  valued at market price, falling back to cost where no quote exists. */
export async function portfolioAllocation(): Promise<PortfolioAllocation> {
  const positions = (await listValuedPositions()).filter((p) => p.quantity > 0);
  const valueOf = (p: { marketValueCents: number | null; investedCents: number }) =>
    p.marketValueCents ?? p.investedCents;
  const totalCents = positions.reduce((sum, p) => sum + valueOf(p), 0);

  const slices = (entries: Map<string, number>): AllocationSlice[] =>
    [...entries.entries()]
      .map(([key, valueCents]) => ({
        key,
        valueCents,
        fraction: totalCents > 0 ? valueCents / totalCents : 0,
      }))
      .sort((a, b) => b.valueCents - a.valueCents);

  const byKindMap = new Map<string, number>();
  const byAssetMap = new Map<string, number>();
  for (const p of positions) {
    byKindMap.set(p.kind, (byKindMap.get(p.kind) ?? 0) + valueOf(p));
    byAssetMap.set(p.ticker, (byAssetMap.get(p.ticker) ?? 0) + valueOf(p));
  }

  return { byKind: slices(byKindMap), byAsset: slices(byAssetMap), totalCents };
}

/** Portfolio dividend yield: trailing-12-month income over current value. */
export async function portfolioDividendYield(): Promise<{
  annualIncomeCents: number;
  portfolioValueCents: number;
  dy: number | null;
}> {
  const positions = (await listValuedPositions()).filter((p) => p.quantity > 0);
  const portfolioValueCents = positions.reduce(
    (sum, p) => sum + (p.marketValueCents ?? p.investedCents),
    0,
  );

  const cutoff = Date.now() - 365 * 24 * 60 * 60 * 1000;
  const annualIncomeCents = (await listDividends())
    .filter((d) => d.payDate.getTime() >= cutoff)
    .reduce((sum, d) => sum + d.incomeCents, 0);

  return {
    annualIncomeCents,
    portfolioValueCents,
    dy: portfolioValueCents > 0 ? annualIncomeCents / portfolioValueCents : null,
  };
}
