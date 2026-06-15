# Norte

App pessoal de finanças com leitura de tendências — a bússola que registra meus
gastos, minhas economias e meus investimentos, e me ajuda a navegar rumo a não
depender 100% do trabalho. **Uso próprio.**

> Status: dia 0 — repositório recém-criado. Nenhum código de aplicação ainda.

## Princípios (as decisões que valem mais que o código)

- **Local-first primeiro.** Os dados vivem na minha máquina. Servidor (EC2) e
  acesso remoto ficam para o fim — construir antes de ter o que servir é
  over-engineering.
- **Monólito modular.** Um app só, mas dividido em módulos com fronteiras claras
  (`transações`, `cotações`, `análise`, `regras`). Nada de microsserviços.
- **Núcleo de domínio agnóstico de framework.** A lógica de dinheiro, tendências
  e regras fica em TypeScript puro, sem depender de Next/React — assim um app
  mobile futuro reusa tudo via monorepo, sem reescrever.
- **YAGNI.** Começar simples e só adicionar complexidade quando um problema
  **real e medido** aparecer. O maior risco não é ser lento, é morrer de
  over-engineering antes de ficar útil.
- **Análise descritiva, não preditiva.** O sistema descreve o que os dados
  fizeram (médias, inclinação, drawdown, dividend yield) e dispara alertas por
  **regras que eu defino** — nunca recomenda nem prevê "compre agora".
- **Medir antes de otimizar.** Performance se prova com profiler, não com
  achismo.
- **Segurança do dado sensível.** Banco e segredos **nunca** vão para o git
  (ver `.gitignore`). Tokens criptografados em repouso.

## Stack

| Camada | Escolha |
|---|---|
| Framework | Next.js (App Router) — front + back no mesmo projeto |
| Runtime | Node |
| Banco local | SQLite + Prisma |
| UI / Design System | Tailwind + shadcn/ui |
| Gráficos | Recharts |
| HTTP | `fetch` nativo |

## Roadmap por fases (fatias verticais)

- **Fase 0** — Importar arquivo OFX do Inter → gravar no SQLite → listar
  transações + 1 gráfico de "gasto por mês". Sem API externa, sem login.
- **Fase 1** — Cotações de FII via [brapi.dev](https://brapi.dev) para valorizar
  a carteira e plotar evolução.
- **Fase 2** — Camada de análise descritiva (médias móveis, inclinação por
  regressão, drawdown, tendência de dividend yield).
- **Fase 3** — Motor de regras: alertas que eu defino ("avise se eu sair da
  alocação alvo").
- **Futuro** — Open Finance via Pluggy (saldo/posições automáticos); deploy em
  EC2 + Tailscale (VPN, sem porta pública); acesso pelo celular via web
  responsiva.

## Dados sensíveis — nunca commitar

- `.env*` (segredos, tokens de API)
- `*.sqlite` / `*.db` (o banco com meus dados financeiros)
