import { describe, expect, it } from "vitest";

import { pickCategoryId } from "./categorization";

const rules = [
  { matcher: "iFood", categoryId: "food", priority: 0 },
  { matcher: "aluguel", categoryId: "housing", priority: 0 },
  { matcher: "mercado", categoryId: "groceries", priority: 1 },
  { matcher: "supermercado mercado", categoryId: "groceries-named", priority: 2 },
];

describe("pickCategoryId", () => {
  it("matches a case-insensitive substring", () => {
    expect(pickCategoryId("IFOOD *Restaurante", rules)).toBe("food");
    expect(pickCategoryId("Pagamento Aluguel marco", rules)).toBe("housing");
  });

  it("returns null when nothing matches", () => {
    expect(pickCategoryId("Salario mensal", rules)).toBeNull();
  });

  it("lets the highest priority win when several rules match", () => {
    // matches both "mercado" (p1) and "supermercado mercado" (p2)
    expect(pickCategoryId("Supermercado Mercado X", rules)).toBe("groceries-named");
  });

  it("ignores blank matchers and blank descriptions", () => {
    expect(
      pickCategoryId("anything", [{ matcher: "  ", categoryId: "x", priority: 9 }]),
    ).toBeNull();
    expect(pickCategoryId("", rules)).toBeNull();
  });
});
