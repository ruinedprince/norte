# Norte

App pessoal de finanças **local-first** com leitura **descritiva** de tendências —
a bússola que registra meus gastos, minhas economias e meus investimentos, e me
ajuda a navegar rumo a não depender 100% do trabalho. **Uso próprio.**

> **Status:** escopo funcional **completo** (todas as fases MoSCoW + P/VP + tags,
> médias/inclinação, calendário de dividendos e import CSV). Roda como **app local
> standalone** (sem servidor, sem custo). 67 testes verdes. Orientação rápida no
> [`CLAUDE.md`](CLAUDE.md); decisões completas em [`docs/escopo.md`](docs/escopo.md).

## A pergunta que o Norte responde

Uma só, repetida no tempo: *"quão perto estou de não depender do meu trabalho?"* —
via **3 números-âncora**: **taxa de poupança**, **patrimônio** e **renda passiva
(dividendos) vs. gastos**. Todo o resto serve a esses três.

## O que tem hoje

- **Transações** — import **OFX** (1.x SGML + 2.x XML, Latin-1, dedup idempotente
  por `account+FITID`), import **CSV** (fallback, detecta delimitador/colunas) e
  **lançamento manual** (dinheiro/cartão/Pix). **Categorias** (hierarquia + `kind`)
  com **auto-categorização** por regras, e **tags** livres com filtro.
- **Painel** — os 3 números-âncora em destaque, **gasto por mês / por categoria**,
  **receita × despesa**, **meta de poupança**, **50/30/20 light** e alertas.
- **Contas & saldos** — saldo por conta (inicial + lançamentos) e **patrimônio total**.
- **Investimentos** — **posições** (custo médio), **cotações** via
  [brapi.dev](https://brapi.dev) (ou preço manual offline), **valor da carteira**,
  **dividendos** (histórico + **calendário** dos próximos) e **renda passiva mensal**,
  **alocação + DY**, e **P/VP + indicadores de FII** (a partir do VPA informado).
- **Análise** — **patrimônio no tempo** (caixa + investimentos a mercado), tendências
  **descritivas** (média móvel de 3 meses, **inclinação** em R$/mês, **drawdown**) e
  **renda ativa × dividendos**.
- **Regras** — alertas que **você** define sobre taxa de poupança / DY / gasto do mês
  / variação do patrimônio. Nunca recomenda nem prevê.
- **UI** — dark mode, navegação responsiva, onboarding de 1º uso e linguagem de
  movimento sutil (respeita `prefers-reduced-motion`).

## Rodar

```bash
npm install
npm run dev      # desenvolvimento → http://localhost:3000
npm run build    # build de produção (type-check + build)
npm test         # 67 testes (vitest), foco na matemática de dinheiro
```

**Como app no dia a dia (Windows, sem servidor):** `scripts\build-norte.bat` (uma
vez) → `scripts\install-autostart.bat` para abrir sozinho no logon, numa janela de
app no canto da tela. Passo a passo em [`docs/run-local.md`](docs/run-local.md).
Acesso pelo celular (opcional, grátis) via Tailscale na própria máquina.

> Quer rodar 24/7 num servidor? O runbook de **EC2 + Tailscale** (VPN, sem porta
> pública) está pronto em [`docs/deploy.md`](docs/deploy.md) — serve qualquer Ubuntu.

## Stack

| Camada | Escolha |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions) |
| Linguagem | TypeScript |
| Banco local | SQLite + Prisma 7 (driver adapter `better-sqlite3`) |
| UI / Design System | Tailwind v4 + shadcn/ui |
| Gráficos | Recharts |
| Testes | Vitest |

> Next 16 e Prisma 7 têm breaking changes vs. versões antigas — ver
> [`AGENTS.md`](AGENTS.md) e a seção "Cuidado de versão" do `CLAUDE.md`.

## Arquitetura & princípios

- **Monólito modular.** Um app, módulos com fronteiras claras
  (`src/modules/{transactions,categories,quotes,analysis,rules,investments}`).
- **Núcleo de domínio agnóstico de framework.** A matemática de dinheiro, tendências
  e regras vive em TypeScript puro (`src/core/domain`), sem Next/React — pronta pra
  reuso (ex.: app mobile) e fácil de testar.
- **Portas & adaptadores.** Fontes externas entram por interfaces (`ImportSource`,
  `QuoteProvider`) — trocar/adicionar fonte sem tocar no núcleo.
- **YAGNI** e **medir antes de otimizar.**
- **Descritivo, nunca preditivo.** O Norte descreve o que os dados fizeram e dispara
  alertas por **regras suas** — jamais recomenda ou prevê investimento.
- **Local-first.** Os dados vivem na sua máquina; integração externa é *best-effort*
  e nunca bloqueia a UI.

## Convenções

- **Dinheiro** sempre em **centavos** inteiros (`amountCents`), nunca float
  (`src/core/domain/money.ts`).
- **Idioma:** código, schema e identificadores em **inglês**; **só a UI** em português.
- **Git:** `feature/*` → `dev` → `main`. Commits em inglês.

## Dados sensíveis — nunca commitar

Protegidos pelo `.gitignore` (ver escopo §7):

- `.env*` — segredos e tokens de API (ex.: `BRAPI_TOKEN`).
- `*.db` / `*.sqlite` — o banco com os dados financeiros.

> Cripto-em-repouso dos tokens e backup automático (Litestream) ficam para o
> cenário de deploy remoto; rodando local, os dados são só seus, na sua máquina.
