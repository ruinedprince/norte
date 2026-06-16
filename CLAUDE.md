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
- `core/domain/money.ts` (centavos, `formatBRL`/`parseBRLToCents`) + landing page
  (acento índigo, serif). `main` e `dev` estão no commit do scaffold.

## Próxima fatia

`feature/ofx-import` — importar OFX (adapter `ImportSource`) → gravar no SQLite via Prisma →
tela de transações + gráfico de gasto por mês. **shadcn/ui entra aqui**
(`npx shadcn@latest init`). Requisitos do adapter OFX em `docs/escopo.md` (#6: SGML+XML,
encoding Latin-1, dedup por `(account+FITID)` com fallback).

## Rodar

- `npm run dev` → http://localhost:3000
- `npm run build` (type-check + build de produção)

@AGENTS.md
