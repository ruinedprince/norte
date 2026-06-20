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
  token, preço manual). `[Could]` P/VP + indicadores de FII entregue depois (fatia
  `fii-indicators`, abaixo). 40 testes verdes.
- **Fase 3 (análise & tendências) entregue** (em `dev` e `main`): `/analysis` — **patrimônio no
  tempo** (caixa + investimentos a mercado, `netWorthSeries` no core), tendências (variação 3m +
  **drawdown**) e **renda ativa × dividendos** (fatia da renda vinda de dividendos, `passiveShare`).
  44 testes verdes.
- **Fase 4 (motor de regras) entregue** (em `dev` e `main`): `/rules` — regras que o usuário
  define sobre **taxa de poupança / DY / gasto do mês / variação do patrimônio** (comparador +
  limiar), com painel de **alertas** (`evaluateRules` no core). **Fecha o escopo MoSCoW
  (Fases 0–4).** 48 testes verdes.
- **Polish entregue** (em `dev` e `main`): **dark mode** (toggle + sem flash), **nav responsiva**
  (menu mobile), **alertas das regras no Painel**, **onboarding** de 1º uso, Painel reorientado nos
  **3 números-âncora** (taxa de poupança · patrimônio · renda passiva), **eixos de gráfico compactos**
  (`R$ 1,2 mil`), **títulos por página** (`%s · Norte`), e a **linguagem de movimento** do §5
  (`reveal-stagger`, em todas as telas, respeitando `prefers-reduced-motion`).
- **Fatia `aporte↔caixa` entregue** (em `dev` e `main`): aporte/venda debita/credita uma conta-caixa
  (Transaction `type=transfer`, `transferGroupId`), excluída das agregações de receita/despesa — o
  **patrimônio não conta mais o aporte em dobro**. Suíte com 49 testes verdes.
- **Fatia `fii-indicators` entregue** (em `dev` e `main`): **P/VP** por ativo (a partir do **VPA**
  informado manualmente — mesmo padrão da cotação manual, já que a brapi só cobre preço + dividendos)
  e **DY por ativo** (12 meses) num card **"Indicadores"** em `/investments`. `priceToBook` e
  `trailingDividendYield` no core; indicadores **descritivos**, sem cor de recomendação (§3). Fecha o
  `[Could]` de P/VP da Fase 2. 54 testes verdes.
- **Fatia `tags` entregue** (em `dev` e `main`): **tags** (rótulos livres N:N) em `/transactions` —
  gestão (criar/listar/excluir com contagem de uso), **editor inline por linha** (chips removíveis +
  seletor compacto "+ tag") e **filtro** por tag (`?tag=`). Fecha a metade "tags" do `[Must]` da
  Fase 0 (os modelos `Tag`/`TransactionTag` já existiam no schema, sem feature). 55 testes verdes.
- **Fatia `networth-trends` entregue** (em `dev` e `main`): **média móvel de 3 meses** (linha no
  gráfico de patrimônio, `ComposedChart`) + **inclinação** (`linearTrendSlope`, R$/mês) na `/analysis`
  — `movingAverage` e `linearTrendSlope` no core, descritivos (§3, sem previsão). Fecha "médias,
  inclinação" do `[Should]` da Fase 3. 60 testes verdes.
- **Fatia `dividend-calendar` entregue** (em `dev` e `main`): **calendário de dividendos** em
  `/investments` — agenda dos **próximos pagamentos** registrados (pagamento ≥ hoje), agrupada por
  mês, com data-com, pagamento, valor/cota e **a receber** (qtd atual × valor) + total. `dividendCalendar`
  reusa `listDividends` (sem previsão — só eventos registrados, §3). Fecha o "calendário" do `[Must]`
  de dividendos da Fase 2. 61 testes verdes.
- **Fatia `csv-import` entregue** (em `dev` e `main`): **import CSV** em `/transactions` (fallback do
  OFX, §6) — parser genérico atrás de `CsvImportSource` (detecta delimitador `;`/`,`/tab, acha
  colunas data/descrição/valor pelo cabeçalho, datas BR/ISO, centavos **com sinal** e decimal por
  locale do delimitador), persistido numa **conta escolhida** com dedup pelo hash composto
  (`date+amount+memo`, sem FITID). **Fecha o último `[Must]` (OFX/CSV da Fase 0).** 67 testes verdes.
- **Cuidado de versão:** Next 16 e Prisma 7 trazem breaking changes vs. training — Prisma 7
  exige driver adapter (sem `new PrismaClient()` puro) e o `migrate dev` **não regenera** o
  client (rodar `npx prisma generate` após mudar o schema; e **reiniciar o `next dev`** após
  gerar — servidor reusado mantém client antigo em memória). Ver `AGENTS.md`.

## Próxima fatia

**Escopo funcional 100% coberto.** MoSCoW (Fases 0–4) completo + P/VP, e os 4 gaps do escopo
inicial todos fechados (tags · médias/inclinação · calendário de dividendos · import CSV). Não há
mais `[Must]`/`[Should]`/`[Could]` em aberto. O que resta é só:
- **Runtime escolhido: app local standalone** (sem custo, sem servidor). O dono decidiu não pagar
  hospedagem agora e só precisa de acesso pessoal — então o Norte roda na própria máquina:
  `scripts\build-norte.bat` (build) + `scripts\launch-norte.ps1`/`.bat` (sobe o `next start` escondido
  e abre o Norte numa **janela de app pequena no canto superior direito** via Edge/Chrome `--app`) +
  `scripts\install-autostart.bat` (cria atalho na pasta **Inicializar** → abre sozinho no logon).
  `start-norte.bat` continua como modo "só servidor". Runbook em [`docs/run-local.md`](docs/run-local.md).
  Acesso do celular **opcional** via Tailscale na própria máquina (grátis). Limite aceito: disponível
  enquanto o PC estiver ligado.
  > Nota sobre o AWS Free Tier: contas novas (desde jul/2025) ganham **~US$ 200 em créditos por ~6
  > meses** (não mais "12 meses"), depois pago (~US$ 9/mês a micro) — o que pesou na escolha pelo local.
- **EC2 + Tailscale retido como opção futura** (escopo §2/§7): artefatos prontos e versionados —
  [`docs/deploy.md`](docs/deploy.md), `scripts/provision.sh` (swap + Node 22 + `prisma migrate deploy`
  + build + systemd), `deploy/norte.service`, `.env.example`. Servem pra **qualquer Ubuntu** (EC2, VPS
  ou home server) se um dia quiser acesso remoto 24/7. Backup Litestream + cripto dos tokens, idem.
- `Won't` do escopo §3 (Open Finance/Pluggy, previsão/IA, Monte Carlo, etc.) — fora de escopo por design.

## Rodar

- `npm run dev` → http://localhost:3000
- `npm run build` (type-check + build de produção)

@AGENTS.md
