# Escopo do Norte

Documento vivo — a fonte da verdade das decisões de escopo. Atualizado conforme
cada escopo é travado.

## Board de escopos

| # | Escopo | Status |
|---|--------|--------|
| 1 | Arquitetura & Desempenho | ✅ Definido |
| 2 | Forma do app & acesso | ✅ Definido |
| 3 | **Escopo funcional** | ✅ Definido |
| 4 | Modelo de dados | ⬜ A definir |
| 5 | UI & Design System | 🟡 Parcial (ferramentas escolhidas; faltam telas) |
| 6 | Integrações | 🟡 Parcial (fontes decididas; falta travar fase) |
| 7 | Segurança & privacidade | 🟡 Parcial (gitignore/.env feitos) |
| 8 | Método de trabalho | 🟡 Parcial (filosofia alinhada) |

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

## 4. Modelo de dados ⬜

_A definir — próximo._

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
