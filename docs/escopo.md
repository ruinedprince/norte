# Escopo do Norte

Documento vivo — a fonte da verdade das decisões de escopo. Atualizado conforme
cada escopo é travado.

## Board de escopos

| # | Escopo | Status |
|---|--------|--------|
| 1 | Arquitetura & Desempenho | ✅ Definido |
| 2 | Forma do app & acesso | ✅ Definido |
| 3 | Escopo funcional | ✅ Definido |
| 4 | **Modelo de dados** | ✅ Definido |
| 5 | UI & Design System | 🟡 Parcial (ferramentas escolhidas; faltam telas) |
| 6 | Integrações | 🟡 Parcial (fontes decididas; falta travar fase) |
| 7 | Segurança & privacidade | 🟡 Parcial (gitignore/.env feitos) |
| 8 | Método de trabalho | 🟡 Parcial (filosofia alinhada) |

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

## 5. UI & Design System 🟡

Ferramentas: Tailwind + shadcn/ui + Recharts. Faltam: telas e direção visual.

## 6. Integrações 🟡

Fontes: OFX/CSV (Inter), brapi (cotações/dividendos), Pluggy (Open Finance,
futuro). Falta travar o que entra em cada fase.

## 7. Segurança & privacidade 🟡

Feito: `.gitignore` (banco + `.env`), segredos em `.env.local`. Falta: cripto em
repouso dos tokens e auth (só relevante quando/se for pra servidor).

## 8. Método de trabalho 🟡

Filosofia: fatias verticais, git desde o dia 1, spec-antes-de-código, revisão.
Falta formalizar o "como".
