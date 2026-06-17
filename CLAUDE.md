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
- **Fase 3 (análise & tendências) entregue** (em `dev` e `main`): `/analysis` — **patrimônio no
  tempo** (caixa + investimentos a mercado, `netWorthSeries` no core), tendências (variação 3m +
  **drawdown**) e **renda ativa × dividendos** (fatia da renda vinda de dividendos, `passiveShare`).
  44 testes verdes. *Limitação:* aporte de investimento ainda não debita o caixa (sem link
  aporte↔conta — fica pro pairing de transferências, adiado), então o patrimônio pode contar o
  dinheiro do aporte duas vezes.
- **Fase 4 (motor de regras) entregue** (em `dev` e `main`): `/rules` — regras que o usuário
  define sobre **taxa de poupança / DY / gasto do mês / variação do patrimônio** (comparador +
  limiar), com painel de **alertas** (`evaluateRules` no core). **Fecha o escopo MoSCoW
  (Fases 0–4).** 48 testes verdes.
- **Polish entregue** (em `dev` e `main`): **dark mode** (toggle + sem flash), **nav responsiva**
  (menu mobile), **alertas das regras no Painel**, **onboarding** de 1º uso, Painel reorientado nos
  **3 números-âncora** (taxa de poupança · patrimônio · renda passiva), **eixos de gráfico compactos**
  (`R$ 1,2 mil`), e a **linguagem de movimento** do §5 (`reveal-stagger`, em todas as telas,
  respeitando `prefers-reduced-motion`).
- **Cuidado de versão:** Next 16 e Prisma 7 trazem breaking changes vs. training — Prisma 7
  exige driver adapter (sem `new PrismaClient()` puro) e o `migrate dev` **não regenera** o
  client (rodar `npx prisma generate` após mudar o schema; e **reiniciar o `next dev`** após
  gerar — servidor reusado mantém client antigo em memória). Ver `AGENTS.md`.

## Próxima fatia

**Escopo MoSCoW (Fases 0–4) completo.** O que sobra são itens adiados de propósito:
- Produto: link **aporte↔caixa** (pairing de transferências); `[Could]` **P/VP + indicadores de
  FII** (Fase 2); os `Won't` do escopo §3 (Open Finance/Pluggy, previsão/IA, Monte Carlo, etc.).
- Infra adiada (escopo §2/§7): deploy **EC2 + Tailscale**, auth/HTTPS, cripto dos tokens, backup.

Polish inicial feito (dark mode, nav responsiva, alertas no Painel, onboarding). Próxima fatia: você
escolhe — mais polish, um dos adiados (aporte↔caixa, P/VP), ou começar o deploy. Decidir antes da `feature/*`.

## Rodar

- `npm run dev` → http://localhost:3000
- `npm run build` (type-check + build de produção)

@AGENTS.md
