"use server";

import { revalidatePath } from "next/cache";

import { parseBRLToCents } from "@/core/domain/money";
import type { AccountType } from "@/core/domain/transaction";

import { ACCOUNT_TYPE_OPTIONS } from "./account-types";
import { createAccount, updateAccount } from "./repository";

export type AccountFormState = { ok: true } | { ok: false; error: string } | null;

const VALID_TYPES = ACCOUNT_TYPE_OPTIONS.map((o) => o.value);

function normalizeType(value: string): AccountType {
  return (VALID_TYPES as string[]).includes(value) ? (value as AccountType) : "checking";
}

function revalidateViews() {
  revalidatePath("/accounts");
  revalidatePath("/transactions");
  revalidatePath("/");
}

export async function createAccountAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Dê um nome à conta." };

  await createAccount({
    name,
    type: normalizeType(String(formData.get("type") ?? "")),
    openingBalanceCents: parseBRLToCents(String(formData.get("openingBalance") ?? "0")),
  });
  revalidateViews();
  return { ok: true };
}

/** Plain form action used by the editable account rows. */
export async function updateAccountAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;

  await updateAccount({
    id,
    name,
    type: normalizeType(String(formData.get("type") ?? "")),
    openingBalanceCents: parseBRLToCents(String(formData.get("openingBalance") ?? "0")),
  });
  revalidateViews();
}
