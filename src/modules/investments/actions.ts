"use server";

import { revalidatePath } from "next/cache";

import { BrapiQuoteProvider } from "@/core/adapters/brapi/brapi-quote-provider";
import { parseBRLToCents } from "@/core/domain/money";
import type { AssetKind, InvestmentKind } from "@/core/domain/position";

import {
  createAsset,
  createDividend,
  createInvestmentTransaction,
  listPositions,
  saveQuote,
  setAssetBookValue,
} from "./repository";

function utcNoon(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

const ASSET_KINDS: readonly AssetKind[] = ["fii", "stock", "etf"];

export type InvestState = { ok: true } | { ok: false; error: string } | null;

export async function createAssetAction(
  _prev: InvestState,
  formData: FormData,
): Promise<InvestState> {
  const ticker = String(formData.get("ticker") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  const kindRaw = String(formData.get("kind") ?? "");
  const kind = (ASSET_KINDS as string[]).includes(kindRaw)
    ? (kindRaw as AssetKind)
    : "fii";

  if (!ticker) return { ok: false, error: "Informe o ticker (ex.: MXRF11)." };
  if (!name) return { ok: false, error: "Informe o nome do ativo." };

  try {
    await createAsset({ ticker, kind, name });
  } catch {
    return { ok: false, error: "Esse ticker já está cadastrado." };
  }
  revalidatePath("/investments");
  return { ok: true };
}

export async function createInvestmentTransactionAction(
  _prev: InvestState,
  formData: FormData,
): Promise<InvestState> {
  const assetId = String(formData.get("assetId") ?? "");
  const dateStr = String(formData.get("date") ?? "");
  const kind: InvestmentKind = String(formData.get("kind") ?? "") === "sell" ? "sell" : "buy";
  const quantity = Math.trunc(Number(formData.get("quantity")));
  const unitPriceCents = parseBRLToCents(String(formData.get("unitPrice") ?? ""));
  const accountRaw = String(formData.get("accountId") ?? "");
  const accountId = accountRaw && accountRaw !== "none" ? accountRaw : null;

  if (!assetId) return { ok: false, error: "Escolha o ativo." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return { ok: false, error: "Informe a data." };
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { ok: false, error: "Quantidade deve ser maior que zero." };
  }
  if (unitPriceCents <= 0) return { ok: false, error: "Informe o preço unitário." };

  const [year, month, day] = dateStr.split("-").map(Number);
  await createInvestmentTransaction({
    assetId,
    date: new Date(Date.UTC(year, month - 1, day, 12, 0, 0)),
    kind,
    quantity,
    unitPriceCents,
    accountId,
  });
  revalidatePath("/investments");
  revalidatePath("/accounts");
  revalidatePath("/transactions");
  revalidatePath("/");
  return { ok: true };
}

export type QuoteState = { ok: true } | { ok: false; error: string } | null;
export type SyncState = { ok: true; saved: number } | { ok: false; error: string } | null;

/** Manual quote entry — the offline path when there is no brapi token. */
export async function setQuoteAction(
  _prev: QuoteState,
  formData: FormData,
): Promise<QuoteState> {
  const assetId = String(formData.get("assetId") ?? "");
  const closeCents = parseBRLToCents(String(formData.get("price") ?? ""));
  if (!assetId) return { ok: false, error: "Escolha o ativo." };
  if (closeCents <= 0) return { ok: false, error: "Informe um preço válido." };

  await saveQuote({ assetId, closeCents, date: new Date() });
  revalidatePath("/investments");
  revalidatePath("/");
  return { ok: true };
}

export type BookValueState = { ok: true } | { ok: false; error: string } | null;

/** Set an asset's book value per share (VPA) — the manual input behind the
 *  descriptive P/VP indicator (escopo Fase 2 [Could]). */
export async function setAssetBookValueAction(
  _prev: BookValueState,
  formData: FormData,
): Promise<BookValueState> {
  const assetId = String(formData.get("assetId") ?? "");
  const bookValuePerShareCents = parseBRLToCents(String(formData.get("bookValue") ?? ""));
  if (!assetId) return { ok: false, error: "Escolha o ativo." };
  if (bookValuePerShareCents <= 0) return { ok: false, error: "Informe um VPA válido." };

  await setAssetBookValue(assetId, bookValuePerShareCents);
  revalidatePath("/investments");
  revalidatePath("/");
  return { ok: true };
}

/** Best-effort sync of held tickers via brapi. Graceful on no-token/offline —
 *  the app keeps the last stored quotes (escopo §6). */
export async function syncQuotesAction(
  _prev: SyncState,
  _formData: FormData,
): Promise<SyncState> {
  const held = (await listPositions()).filter((p) => p.quantity > 0);
  if (held.length === 0) return { ok: false, error: "Nenhuma posição para cotar." };

  try {
    const results = await new BrapiQuoteProvider().getQuotes(held.map((p) => p.ticker));
    const byTicker = new Map(held.map((p) => [p.ticker.toUpperCase(), p.assetId]));
    let saved = 0;
    for (const result of results) {
      const assetId = byTicker.get(result.ticker.toUpperCase());
      if (assetId) {
        await saveQuote({ assetId, closeCents: result.closeCents, date: result.date });
        saved += 1;
      }
    }
    revalidatePath("/investments");
    revalidatePath("/");
    return { ok: true, saved };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao sincronizar.",
    };
  }
}

export type DividendState = { ok: true } | { ok: false; error: string } | null;

export async function createDividendAction(
  _prev: DividendState,
  formData: FormData,
): Promise<DividendState> {
  const assetId = String(formData.get("assetId") ?? "");
  const exDateStr = String(formData.get("exDate") ?? "");
  const payDateStr = String(formData.get("payDate") ?? "");
  const perShareCents = parseBRLToCents(String(formData.get("perShare") ?? ""));

  if (!assetId) return { ok: false, error: "Escolha o ativo." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payDateStr)) {
    return { ok: false, error: "Informe a data de pagamento." };
  }
  if (perShareCents <= 0) return { ok: false, error: "Informe o valor por cota." };

  const payDate = utcNoon(payDateStr);
  const exDate = /^\d{4}-\d{2}-\d{2}$/.test(exDateStr) ? utcNoon(exDateStr) : payDate;

  await createDividend({ assetId, exDate, payDate, perShareCents });
  revalidatePath("/investments");
  revalidatePath("/");
  return { ok: true };
}
