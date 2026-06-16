"use server";

import { revalidatePath } from "next/cache";

import type { CategoryKind } from "@/core/domain/transaction";

import {
  createCategory,
  createRule,
  deleteCategory,
  deleteRule,
  recategorizeUncategorized,
} from "./repository";

export type FormState = { ok: true } | { ok: false; error: string } | null;
export type ApplyState = { updated: number } | null;

const KINDS: readonly CategoryKind[] = ["need", "want", "saving"];

function revalidateViews() {
  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/");
}

export async function createCategoryAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind") ?? "");
  const parentId = String(formData.get("parentId") ?? "");

  if (!name) return { ok: false, error: "Dê um nome à categoria." };
  if (!KINDS.includes(kind as CategoryKind)) {
    return { ok: false, error: "Escolha um tipo." };
  }

  await createCategory({ name, kind: kind as CategoryKind, parentId: parentId || null });
  revalidateViews();
  return { ok: true };
}

export async function createRuleAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const matcher = String(formData.get("matcher") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const priority = Number(formData.get("priority"));

  if (!matcher) return { ok: false, error: "Informe o texto a procurar (ex.: iFood)." };
  if (!categoryId) return { ok: false, error: "Escolha a categoria de destino." };

  await createRule({
    matcher,
    categoryId,
    priority: Number.isFinite(priority) ? priority : 0,
  });
  revalidateViews();
  return { ok: true };
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteCategory(id);
  revalidateViews();
}

export async function deleteRuleAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteRule(id);
  revalidateViews();
}

export async function applyRulesAction(
  _prev: ApplyState,
  _formData: FormData,
): Promise<ApplyState> {
  const { updated } = await recategorizeUncategorized();
  revalidateViews();
  return { updated };
}
