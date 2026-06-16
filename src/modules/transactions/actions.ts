"use server";

import { revalidatePath } from "next/cache";

import { OfxImportSource } from "@/core/adapters/ofx/ofx-import-source";

import { persistStatement, type ImportResult } from "./repository";

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
