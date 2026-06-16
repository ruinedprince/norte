# Norte — orientação para a sessão

App pessoal de finanças **local-first**, com leitura **descritiva** de tendências. Uso próprio.

**A fonte da verdade das decisões é [`docs/escopo.md`](docs/escopo.md)** — leia antes de
decidir qualquer coisa de arquitetura ou escopo.

## Convenções (não mudar sem motivo)

- **Idioma:** código, schema, identificadores e comentários em **inglês**; **só a UI** em
  português (i18n: chaves em inglês, textos em PT).
- **Dinheiro:** sempre inteiro em **centavos** (`amountCents`), nunca float. Helper em
  `src/core/domain/money.ts`.
- **Arquitetura:** monólito modular. Núcleo de domínio agnóstico de framework em `src/core`;
  features em `src/modules/*`; integrações externas atrás de portas (`ImportSource`,
  `QuoteProvider`).
- **Git:** `feature/*` → `dev` → `main`, tudo **local** (sem remote ainda). Commits **em
  inglês**. Docs/config triviais podem ir direto na `main`.
- **Filosofia:** YAGNI; medir antes de otimizar; análise **descritiva, nunca preditiva**;
  banco e segredos nunca no git.

## Estado atual (Fase 0)

- Scaffold pronto: Next 16 + TypeScript + Tailwind v4 + App Router (`src/`).
- Estrutura modular: `src/modules/{transactions,categories,quotes,analysis,rules}`,
  `src/core/domain`, `src/lib`.
- `core/domain/money.ts` (centavos, `formatBRL`/`parseBRLToCents`).
- **Fatia `ofx-import` entregue** (em `dev` e `main`): import OFX (1.x SGML + 2.x XML,
  encoding Latin-1, dedup `(account+FITID)` idempotente, atrás da porta `ImportSource`)
  → SQLite via **Prisma 7 + driver adapter `better-sqlite3`** (client gerado em
  `src/generated/prisma`, gitignored) → Painel (`/`, gráfico de gasto/mês em Recharts)
  e Transações (`/transactions`, import + lista) em **shadcn/ui** (paleta quente + índigo).
  17 testes verdes (`npm test`) + build limpo. OFX de exemplo em `docs/samples/`.
- **Fatia `categories` entregue** (em `dev` e `main`): Categorias (CRUD + hierarquia simples,
  `kind` need/want/saving), **auto-categorização** por regras aplicadas no import + ação de
  re-aplicar nas não categorizadas, e gráfico **"gasto por categoria"** no Painel — completa o
  dashboard `[Must]` e o `[Should]` da Fase 0. Suíte agora com 21 testes verdes.
- **Cuidado de versão:** Next 16 e Prisma 7 trazem breaking changes vs. training — Prisma 7
  exige driver adapter (sem `new PrismaClient()` puro). Ver `AGENTS.md`.

## Próxima fatia

A definir (proponho → você corta/adiciona). Falta um `[Must]` da Fase 0: **lançamento manual**
(transações sem OFX — dinheiro/cartão). Depois, **Fase 1**: receita × despesa no tempo e a
**taxa de poupança** (número-âncora do projeto). Decidir antes de abrir a `feature/*`.

## Rodar

- `npm run dev` → http://localhost:3000
- `npm run build` (type-check + build de produção)

@AGENTS.md
