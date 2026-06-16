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

## Estado atual

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
- **Fatia `manual-entry` entregue** (em `dev` e `main`): lançamento manual (dinheiro/cartão/Pix)
  na tela de Transações — conta + direção (saída/entrada) + valor + data + categoria opcional,
  `source: "manual"` com `dedupKey` único (entradas idênticas não dedupam). **Fecha a Fase 0**
  (todos os `[Must]` + o `[Should]`). 24 testes verdes.
- **Fatia `savings-rate` entregue** (Fase 1, em `dev` e `main`): `monthlyCashFlow` (receita ×
  despesa por mês) + **taxa de poupança** mensal (`savingsRate` no core — `null` sem receita,
  negativa = alerta) → Painel reorientado com a taxa de poupança em destaque + gráfico
  receita × despesa. 27 testes verdes.
- **Fatias `accounts-balances` + `savings-goal` + `budget-503020` entregues** (Fase 1, em `dev`
  e `main`): **Contas & saldos** (`/accounts`, saldo = saldo inicial + lançamentos, patrimônio
  total), **meta de poupança** (`Setting` key/value; meta vs. taxa atual no Painel) e **50/30/20
  light** (split need/want/poupança do mês vs. alvos). **Fecha a Fase 1** (`[Must]` + `[Should]`
  + `[Could]`). 30 testes verdes.
- **Fase 2 (investimentos) entregue** (em `dev` e `main`): `/investments` — **posições** (custo
  médio derivado de aportes/vendas), **cotações** atrás da porta `QuoteProvider` (adapter brapi +
  entrada manual; offline mantém a última), **valor da carteira** + resultado, **dividendos** +
  **renda passiva mensal**, e **alocação + DY**. brapi requer `BRAPI_TOKEN` no `.env.local` (sem
  token, preço manual). `[Could]` P/VP + indicadores de FII **adiado**. 40 testes verdes.
- **Cuidado de versão:** Next 16 e Prisma 7 trazem breaking changes vs. training — Prisma 7
  exige driver adapter (sem `new PrismaClient()` puro) e o `migrate dev` **não regenera** o
  client (rodar `npx prisma generate` após mudar o schema; e **reiniciar o `next dev`** após
  gerar — servidor reusado mantém client antigo em memória). Ver `AGENTS.md`.

## Próxima fatia

**Fase 3 — análise descritiva & tendências.** Candidatos (proponho → você corta/adiciona):
trajetória de patrimônio e de renda passiva no tempo, tendências (médias, inclinação, drawdown —
descritivo, nunca preditivo) e "quanto da renda já vem de dividendos". Pendência da Fase 2:
`[Could]` P/VP + indicadores de FII. Decidir o recorte antes da `feature/*`.

## Rodar

- `npm run dev` → http://localhost:3000
- `npm run build` (type-check + build de produção)

@AGENTS.md
