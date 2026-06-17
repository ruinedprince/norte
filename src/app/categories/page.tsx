import {
  deleteCategoryAction,
  deleteRuleAction,
} from "@/modules/categories/actions";
import { ApplyRulesButton } from "@/modules/categories/components/apply-rules-button";
import { CategoryForm } from "@/modules/categories/components/category-form";
import { RuleForm } from "@/modules/categories/components/rule-form";
import { listCategories, listRules } from "@/modules/categories/repository";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Always reflect the latest database state (revalidated after each change).
export const dynamic = "force-dynamic";

export const metadata = { title: "Categorias" };

const KIND_LABELS: Record<string, string> = {
  need: "Necessidade",
  want: "Desejo",
  saving: "Poupança",
};

export default async function CategoriesPage() {
  const [categories, rules] = await Promise.all([listCategories(), listRules()]);
  const options = categories.map((category) => ({
    id: category.id,
    name: category.name,
  }));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10 reveal-stagger">
      <header>
        <h1 className="font-serif text-3xl">Categorias</h1>
        <p className="mt-1 text-muted-foreground">
          Organize os gastos e deixe o Norte categorizar sozinho.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Nova categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm parents={options} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categorias</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma categoria ainda.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="font-medium">{category.name}</span>
                    {category.parent && (
                      <span className="text-xs text-muted-foreground">
                        ↳ {category.parent.name}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      · {KIND_LABELS[category.kind] ?? category.kind}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      · {category._count.transactions} lanç.
                    </span>
                  </div>
                  <form action={deleteCategoryAction}>
                    <input type="hidden" name="id" value={category.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Excluir
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regras de categorização</CardTitle>
          <CardDescription>
            Quando a descrição contém um texto, o Norte aplica a categoria. Maior
            prioridade vence. As regras valem em novos imports; use o botão abaixo
            para aplicar nas transações já importadas.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <RuleForm categories={options} />
          {rules.length > 0 && (
            <ul className="divide-y divide-border">
              {rules.map((rule) => (
                <li
                  key={rule.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="text-sm">
                    <span className="text-muted-foreground">“{rule.matcher}”</span>{" "}
                    → <span className="font-medium">{rule.category.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      prioridade {rule.priority}
                    </span>
                  </div>
                  <form action={deleteRuleAction}>
                    <input type="hidden" name="id" value={rule.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Excluir
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-border pt-4">
            <ApplyRulesButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
