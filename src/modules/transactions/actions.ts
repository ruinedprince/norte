"use server";

import { revalidatePath } from "next/cache";

import { parseSignedCents } from "@/core/domain/money";
import { CsvImportSource } from "@/core/adapters/csv/csv-import-source";
import { OfxImportSource } from "@/core/adapters/ofx/ofx-import-source";

import {
  addTransactionTag,
  createManualTransaction,
  createTag,
  deleteTag,
  persistCsvTransactions,
  persistStatement,
  removeTransactionTag,
  setTransactionCategory,
  setTransactionTransfer,
  type ImportResult,
} from "./repository";

export type ImportState =
  | { ok: true; result: ImportResult }
  | { ok: false; error: string }
  | null;

/**
 * Server Action for the OFX upload form. Reads the file as raw bytes (so the
 * adapter can honor the statement's declared encoding), parses it behind the
 * ImportSource port, persists idempotently, and refreshes the views.
 * Shaped for React's `useActionState` (prevState, formData).
 */
export async function importOfxAction(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecione um arquivo OFX." };
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const statement = new OfxImportSource().parse(bytes);

    if (statement.transactions.length === 0) {
      return { ok: false, error: "Nenhuma transação encontrada no arquivo." };
    }

    const result = await persistStatement(statement);
    revalidatePath("/transactions");
    revalidatePath("/");
    return { ok: true, result };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao importar o arquivo.",
    };
  }
}

export type CsvImportState =
  | { ok: true; result: ImportResult }
  | { ok: false; error: string }
  | null;

/**
 * Server Action for the CSV upload form (escopo §6 fallback for OFX). A CSV has
 * no account, so the user picks the target account; transactions are parsed
 * behind the CsvImportSource port and persisted into it idempotently.
 */
export async function importCsvAction(
  _prev: CsvImportState,
  formData: FormData,
): Promise<CsvImportState> {
  const file = formData.get("file");
  const accountId = String(formData.get("accountId") ?? "");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecione um arquivo CSV." };
  }
  if (!accountId) return { ok: false, error: "Escolha a conta de destino." };

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const transactions = new CsvImportSource().parse(bytes);
    if (transactions.length === 0) {
      return { ok: false, error: "Nenhuma transação reconhecida no CSV." };
    }
    const result = await persistCsvTransactions(accountId, transactions);
    revalidatePath("/transactions");
    revalidatePath("/");
    return { ok: true, result };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao importar o CSV.",
    };
  }
}

export type ManualState = { ok: true } | { ok: false; error: string } | null;

/** Server Action for the manual-entry form. Money is parsed in cents with the
 *  direction deciding the sign; the date (YYYY-MM-DD) is stored at UTC noon to
 *  match imported dates. Shaped for `useActionState`. */
export async function createManualTransactionAction(
  _prev: ManualState,
  formData: FormData,
): Promise<ManualState> {
  const accountId = String(formData.get("accountId") ?? "");
  const dateStr = String(formData.get("date") ?? "");
  const amount = String(formData.get("amount") ?? "");
  const direction =
    String(formData.get("direction") ?? "expense") === "income"
      ? "income"
      : "expense";
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");

  if (!accountId) return { ok: false, error: "Escolha a conta." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { ok: false, error: "Informe a data." };
  }

  const amountCents = parseSignedCents(amount, direction);
  if (!amountCents) return { ok: false, error: "Informe um valor maior que zero." };

  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  await createManualTransaction({
    accountId,
    date,
    amountCents,
    description,
    categoryId: categoryId || null,
  });
  revalidatePath("/transactions");
  revalidatePath("/");
  return { ok: true };
}

export type TagState = { ok: true } | { ok: false; error: string } | null;

/** Create a tag (Fase 0 [Must]). Idempotent on the unique name. */
export async function createTagAction(
  _prev: TagState,
  formData: FormData,
): Promise<TagState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Informe o nome da tag." };

  await createTag(name);
  revalidatePath("/transactions");
  return { ok: true };
}

/** Delete a tag; its transaction links cascade away. */
export async function deleteTagAction(id: string): Promise<void> {
  await deleteTag(id);
  revalidatePath("/transactions");
}

/** Attach a tag to a transaction. */
export async function addTransactionTagAction(
  transactionId: string,
  tagId: string,
): Promise<void> {
  await addTransactionTag(transactionId, tagId);
  revalidatePath("/transactions");
}

/** Detach a tag from a transaction. */
export async function removeTransactionTagAction(
  transactionId: string,
  tagId: string,
): Promise<void> {
  await removeTransactionTag(transactionId, tagId);
  revalidatePath("/transactions");
}

/** Set or clear a transaction's category (manual per-row override). */
export async function setTransactionCategoryAction(
  transactionId: string,
  categoryId: string | null,
): Promise<void> {
  await setTransactionCategory(transactionId, categoryId);
  revalidatePath("/transactions");
  revalidatePath("/");
}

/** Toggle whether a transaction counts as a transfer (out of income/expense). */
export async function setTransactionTransferAction(
  transactionId: string,
  isTransfer: boolean,
): Promise<void> {
  await setTransactionTransfer(transactionId, isTransfer);
  revalidatePath("/transactions");
  revalidatePath("/");
}
