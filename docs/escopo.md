# Escopo do Norte

Documento vivo — a fonte da verdade das decisões de escopo. Atualizado conforme
cada escopo é travado.

## Board de escopos

| # | Escopo | Status |
|---|--------|--------|
| 1 | Arquitetura & Desempenho | ✅ Definido |
| 2 | Forma do app & acesso | ✅ Definido |
| 3 | Escopo funcional | ✅ Definido |
| 4 | Modelo de dados | ✅ Definido |
| 5 | **UI & Design System** | ✅ Definido |
| 6 | **Integrações** | ✅ Definido |
| 7 | **Segurança & privacidade** | ✅ Definido |
| 8 | **Método de trabalho** | ✅ Definido |

---

## Convenções

- **Idioma:** código, schema do banco, identificadores e comentários em
  **inglês**; **só a UI** em português (via i18n — chaves em inglês, textos em PT).
- **Dinheiro:** sempre inteiro em **centavos** (`amountCents`), nunca float.
- **Commits:** mensagens em **inglês** (a partir de 2026-06-15; os 2 primeiros
  commits ficaram em PT, sem reescrever histórico).
- **Docs:** `README` e `docs/` em português (anotações do dono do projeto).

---

## 1. Arquitetura & Desempenho ✅

- **Stack:** Next.js (App Router) + Node, local-first; SQLite + Prisma;
  Tailwind + shadcn/ui; Recharts; `fetch` nativo.
- **Monólito modular:** 1 app, módulos com fronteiras claras (`transações`,
  `cotações`, `análise`, `regras`).
- **Núcleo de domínio agnóstico de framework** (TS puro) — pronto para reuso
  num app mobile futuro via monorepo.
- **Filosofias:** YAGNI; medir-antes-de-otimizar; análise descritiva (não
  preditiva); banco e segredos nunca no git.

## 2. Forma do app & acesso ✅

- **Local-first agora** — roda em `localhost`, dados na máquina.
- **Web responsiva.**
- **Adiado de propósito:** deploy EC2 + Tailscale (VPN, sem porta pública) e
  acesso pelo celular.

## 3. Escopo funcional ✅

### Espinha conceitual

O Norte responde **uma** pergunta, repetida no tempo: *"quão perto estou de não
depender do meu trabalho?"* — via **3 números**: **taxa de poupança**,
**patrimônio** e **renda passiva (dividendos) vs. gastos**. Todo o resto serve a
esses três.

### Método de orçamento

**Pay Yourself First + 50/30/20 light.** Evitar zero-based/envelope (fricção
alta → abandono). O melhor método é o que se mantém.

### Fases (prioridade MoSCoW)

**Fase 0 — Ver pra onde o dinheiro vai** *(fundação)*
- `[Must]` Importar OFX/CSV do Inter + lançamento manual
- `[Must]` Categorias (hierarquia simples) + tags
- `[Must]` Dashboard: gasto por mês + gasto por categoria
- `[Should]` Regra de auto-categorização (ex.: "iFood" → Alimentação)

**Fase 1 — Fluxo de caixa & taxa de poupança** *(o KPI da independência)*
- `[Must]` Receita × despesa no tempo
- `[Must]` Taxa de poupança mensal — número-âncora do projeto
- `[Must]` Contas & saldos → semente do patrimônio
- `[Should]` Meta de poupança ("pay yourself first") + acompanhamento
- `[Could]` Estrutura leve 50/30/20

**Fase 2 — Investimentos** *(2º pilar; precisa da brapi)*
- `[Must]` Cadastro de posições (FIIs, aportes)
- `[Must]` Cotações via brapi → valor da carteira no tempo
- `[Must]` Dividendos: calendário + histórico + renda passiva mensal
- `[Should]` Alocação (por ativo/tipo) + DY da carteira
- `[Could]` P/VP e indicadores de FII

**Fase 3 — Análise descritiva & tendências**
- `[Should]` Trajetória de patrimônio e de renda passiva
- `[Should]` Tendências (médias, inclinação, drawdown) — descritivo, não preditivo
- `[Could]` "Quanto da minha renda já vem de dividendos"

**Fase 4 — Motor de regras (o "guia")**
- `[Should]` Alertas por regras que o usuário define ("fora da alocação alvo",
  "DY caiu de X")

### Fora de escopo (`Won't` — por enquanto)

Open Finance auto-sync (Pluggy); sync de banco em tempo real; IA/previsão de
fluxo; Monte Carlo/projeção FIRE sofisticada; multi-moeda; quitação de dívidas;
divisão de contas; anexos de recibo; **qualquer recomendação ou previsão de
investimento** (por design).

### Ordem F1/F2

Fluxo de caixa (F1) vem **antes** de investimentos (F2) porque entrega o KPI
principal sem depender de API externa. Reavaliar se a prioridade mudar.

---

## 4. Modelo de dados ✅

Modelo **inicial** — evolui conforme as fases. Nomes em inglês (ver Convenções).

### Decisões

- **Dinheiro em centavos** (inteiro), nunca float — é daqui que vem a exatidão de
  centavo, não do modelo de lançamento.
- **Single-entry:** transação tem conta + valor **com sinal** + tipo;
  transferência é um par linkado (`transferGroupId`) pra não contar em dobro.
  Evolui pra double-entry depois, se um dia precisar.

### Entidades — Fase 0 (núcleo)

- **Account** — `id`, `name`, `type` (checking | savings | cash | brokerage),
  `currency` (default BRL)
- **Transaction** — `id`, `accountId`, `date`, `amountCents` (com sinal), `type`
  (income | expense | transfer), `categoryId?`, `description`, `source`
  (ofx | manual), `externalId?` (dedup do import), `transferGroupId?`
- **Category** — `id`, `name`, `parentId?` (hierarquia), `kind`
  (need | want | saving) ← pro 50/30/20
- **Tag** + **TransactionTag** (relação N:N)
- **CategorizationRule** — `id`, `matcher`, `categoryId`, `priority`

### Entidades — Fase 2 (investimentos; desenho agora, construir depois)

- **Asset** — `id`, `ticker` (ex.: `MXRF11`), `kind` (fii | stock | etf), `name`
- **InvestmentTransaction** — `id`, `assetId`, `accountId`, `date`, `kind`
  (buy | sell), `quantity`, `unitPriceCents` → posição é **derivada**
- **Quote** — `id`, `assetId`, `date`, `closeCents` (série temporal local)
- **Dividend** — `id`, `assetId`, `exDate`, `payDate`, `perShareCents`

### Fase 4

- **Rule** (alertas) — desenhar quando chegar lá.

---

## 5. UI & Design System ✅

### Direção visual

- **Fundação "Claude calmo":** superfícies planas, muito espaço, neutros quentes,
  zero gradiente/sombra.
- **Identidade do Norte:** acento **índigo "estrela do norte"** sobre a base
  quente; **números-herói em serif** (toque editorial).
- **Semântica de dinheiro:** verde = entradas/dividendos; gasto em texto neutro;
  vermelho **só** para alerta (estouro de alvo).
- **Ferramentas:** Tailwind + shadcn/ui + Recharts.

### Telas — Fase 0

`Dashboard` (KPIs + gasto por mês/categoria + lançamentos recentes) ·
`Transações` (lista + importar OFX) · `Categorias`.

### Linguagem de movimento ("imersivo, não exagerado")

- **Onde:** entrada (números sobem, barras crescem, listas em *stagger*); mudança
  de estado (toggles/abas deslizam, gráfico reanima); micro-feedback (hover/press).
- **Tempos:** micro ~120ms · estado ~200ms · entrada ~500–800ms. Easing
  **ease-out**; sem bounce elástico.
- **Barato:** animar só `transform`/`opacity` (60fps).
- **Limites:** nada de loop/idle infinito; respeitar `prefers-reduced-motion`.

## 6. Integrações ✅

Cada fonte externa entra por uma **porta (interface)**; o domínio não conhece os
detalhes (anti-corruption layer) → trocar/adicionar fonte sem tocar no núcleo.

### Faseamento

| Fase | Integração | Entra |
|---|---|---|
| 0 | OFX/CSV (Inter) | importar extrato → transações |
| 1 | — | nada externo |
| 2 | brapi | cotações + dividendos de FII |
| Futuro | Pluggy (Open Finance) | saldo/posições automáticos |

### OFX adapter (Fase 0) — porta `ImportSource`

- Priorizar **OFX** (traz `FITID`); **CSV** como fallback (ex.: fatura do cartão).
- Aguentar **OFX 1.x (SGML, fechamento de tag opcional)** e **2.x (XML)**.
- Tratar **encoding Latin-1/Windows-1252** (acentos).
- **Dedup:** `(account + FITID)` com fallback por hash `(date+amount+memo)` quando
  o FITID faltar/repetir. Import **idempotente**.
- Libs candidatas (atrás do adapter): `ofx-data-extractor`, `@hublaw/ofx-parser`.
  Validar com OFX **real do Inter** na Fase 0.

### brapi (Fase 2) — porta `QuoteProvider`

- **Token grátis obrigatório** pra FII (sem token cobre só 4 blue-chips). `Bearer`
  no `.env.local`.
- Endpoints: `/api/v2/fii/...` ou `/api/quote/{ticker}?dividends=true`.
- **Snapshot diário** (1 chamada/ticker/dia) → histórico acumula local; respeita
  o rate limit (erro 402 ao estourar).
- Cache + **degradação graciosa** (offline mostra a última cotação salva).

### Pluggy (Futuro)

Entra pela mesma porta `ImportSource`. Gatilho: o import manual incomodar. PF
exige agregador; o consentimento expira.

### Princípio transversal

Local-first: o app funciona **offline**; integração externa é *best-effort* e
nunca bloqueia a UI.

## 7. Segurança & privacidade ✅

Escopo atual (local-first) — suficiente e feito:
- Dados só na máquina; `.gitignore` protege banco (`*.sqlite`/`*.db`) e segredos
  (`.env*`).
- Token brapi e afins em `.env.local` — nunca no banco, no git ou em chat.

**Deferido** (gatilho = decisão de deploy): auth (Auth.js/MFA **ou** VPN
Tailscale), HTTPS, cripto-em-repouso dos tokens, backup Litestream.

## 8. Método de trabalho ✅

- **Fatias verticais** — uma feature ponta-a-ponta por vez, começando na Fase 0.
- **Workflow de branches:** `feature/*` → merge em `dev` → **testar (rodar o
  app)** → promover `feature/*` para `main`. `dev` = integração/teste; `main` =
  sempre testada/releasável. (Com o EC2 futuro: `dev`→staging, `main`→prod.)
- **Carve-out:** docs/config triviais (ex.: `escopo.md`) podem ir direto na `main`.
- **Commits** pequenos, em inglês.
- **Spec viva** = `docs/escopo.md`.
- **Colaboração:** proponho → você corta/adiciona → implemento e **mostro
  rodando** → você valida. Passos pequenos e verificáveis.
- **Testes:** testar de fato (rodar o app), foco na **matemática de dinheiro**.
- **"Pronto"** por fatia = roda no app + testado + commitado + em `main`.
