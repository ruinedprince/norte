import { pickCategoryId } from "@/core/domain/categorization";
import type { CategoryKind } from "@/core/domain/transaction";
import { prisma } from "@/lib/prisma";

export function listCategories() {
  return prisma.category.findMany({
    orderBy: [{ name: "asc" }],
    include: { parent: true, _count: { select: { transactions: true } } },
  });
}

export function createCategory(input: {
  name: string;
  kind: CategoryKind;
  parentId?: string | null;
}) {
  return prisma.category.create({
    data: {
      name: input.name,
      kind: input.kind,
      parentId: input.parentId || null,
    },
  });
}

/** Deleting a category nulls its transactions' categoryId and cascades its
 *  rules (per the schema relations). */
export function deleteCategory(id: string) {
  return prisma.category.delete({ where: { id } });
}

export function listRules() {
  return prisma.categorizationRule.findMany({
    orderBy: [{ priority: "desc" }, { matcher: "asc" }],
    include: { category: true },
  });
}

export function createRule(input: {
  matcher: string;
  categoryId: string;
  priority: number;
}) {
  return prisma.categorizationRule.create({ data: input });
}

export function deleteRule(id: string) {
  return prisma.categorizationRule.delete({ where: { id } });
}

/**
 * Apply the rules to currently-uncategorized transactions. Leaves already-
 * categorized rows untouched. Returns how many were updated.
 */
export async function recategorizeUncategorized(): Promise<{ updated: number }> {
  const rules = await prisma.categorizationRule.findMany({
    select: { matcher: true, categoryId: true, priority: true },
  });
  if (rules.length === 0) return { updated: 0 };

  const uncategorized = await prisma.transaction.findMany({
    where: { categoryId: null },
    select: { id: true, description: true },
  });

  let updated = 0;
  for (const tx of uncategorized) {
    const categoryId = pickCategoryId(tx.description, rules);
    if (categoryId) {
      await prisma.transaction.update({ where: { id: tx.id }, data: { categoryId } });
      updated += 1;
    }
  }
  return { updated };
}
