"use server";

import { revalidatePath } from "next/cache";

import { parseBRLToCents } from "@/core/domain/money";
import type { AssetKind, InvestmentKind } from "@/core/domain/position";

import { createAsset, createInvestmentTransaction } from "./repository";

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
  });
  revalidatePath("/investments");
  return { ok: true };
}
