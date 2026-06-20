# Deploy do Norte — EC2 (Free Tier) + Tailscale

Runbook para subir o Norte numa instância EC2 acessível **só pela Tailscale**
(VPN, sem porta pública na internet), conforme escopo §2/§7.

**Divisão:** você faz as partes da AWS/Tailscale (conta, instância, chaves,
segredos); os artefatos do repo (`scripts/provision.sh`, `deploy/norte.service`,
`.env.example`) já estão prontos. Eu **não** entro com suas credenciais — siga os
passos abaixo e me chame se algo travar.

## Arquitetura

```
   Celular/Notebook (app Tailscale)  ──VPN──►  EC2 (Ubuntu) ── next start :3000
                                                  └─ tailscale serve → HTTPS no tailnet
```

- A EC2 roda o app em `localhost:3000`. **Nada** fica exposto na internet.
- A **Tailscale** controla o acesso (só seus dispositivos entram) e dá **HTTPS**
  via `tailscale serve`. Por isso **não há login no app nem domínio público** —
  a VPN é o perímetro.
- O banco é um arquivo SQLite (`prod.db`) no disco da instância. Dado financeiro:
  nunca vai pro git; backup automático (Litestream) fica para uma fatia seguinte.

## Pré-requisitos (você)

1. **Conta AWS** (cartão para billing; o Free Tier não cobra dentro dos limites).
2. **Conta Tailscale** (grátis para uso pessoal) — https://tailscale.com.
3. No seu Windows: `ssh` e `scp` já vêm no Windows 11 (OpenSSH).

---

## 1. Criar a instância EC2

No console AWS → **EC2** → **Launch instance**:

- **Região** (canto superior direito): **São Paulo (sa-east-1)** — menor latência.
- **Name:** `norte`.
- **AMI:** **Ubuntu Server 24.04 LTS** (64-bit x86). Marcada como *Free tier eligible*.
- **Instance type:** o tipo marcado **Free tier eligible** — **`t3.micro`** (ou
  `t2.micro`), 1 GB RAM.
  - Se for `t3.micro`: em **Advanced details → Credit specification**, deixe
    **`standard`** (não `unlimited`). Assim o build pesado só fica mais lento em
    vez de gerar cobrança de CPU. (`t2.micro` já é standard.)
- **Key pair:** **Create new key pair** → tipo RSA/ED25519, formato `.pem`. Baixe
  e **guarde** o arquivo (ex.: `norte.pem`) — é como você entra na máquina.
- **Network settings → Firewall (security group):** crie um novo grupo e deixe
  **apenas**:
  - **SSH (22)** com source **My IP** (só o seu IP atual).
  - **Remova** qualquer regra de HTTP/HTTPS. **Não** abra 80/443/3000 — o acesso
    é pela Tailscale, não pela internet.
- **Storage:** 8–30 GB gp3 (até 30 GB é Free Tier).
- **Launch instance.** Anote o **IPv4 público** da instância.

> Mais tarde, com a Tailscale no ar, dá para remover até a regra de SSH público e
> entrar via Tailscale SSH — deixando a instância **sem nenhuma** porta pública.

## 2. Conectar via SSH

No seu Windows (PowerShell ou Git Bash), na pasta onde está a chave:

```bash
# Permissão da chave (Git Bash); no PowerShell o SSH aceita sem isso.
chmod 400 norte.pem
ssh -i norte.pem ubuntu@SEU_IP_PUBLICO
```

Aceite o fingerprint na primeira vez. Você cai no shell da instância (`ubuntu@...`).

## 3. Levar o código para a instância

O repositório é local (sem remote). Duas opções:

**Opção A — repositório privado no GitHub (recomendado: facilita updates).**
No seu Windows, crie um repo **privado** e empurre:

```bash
# no seu Windows, na pasta do projeto
gh repo create norte --private --source=. --push   # ou crie pelo site e:
# git remote add origin git@github.com:SEU_USER/norte.git && git push -u origin main
```

Na instância:

```bash
sudo apt-get update -y && sudo apt-get install -y git
git clone https://github.com/SEU_USER/norte.git ~/norte   # use um PAT/SSH p/ repo privado
```

**Opção B — sem remote, via tarball (`git archive` + `scp`).**
No seu Windows (Git Bash), gera um pacote só com os arquivos versionados (sem
`node_modules`, `.next`, `.env`, `*.db`):

```bash
git archive --format=tar.gz -o norte.tgz HEAD
scp -i norte.pem norte.tgz ubuntu@SEU_IP_PUBLICO:~
```

Na instância:

```bash
mkdir -p ~/norte && tar -xzf ~/norte.tgz -C ~/norte
```

## 4. Configurar os segredos (`.env`)

Na instância, dentro de `~/norte`:

```bash
cd ~/norte
cp .env.example .env
nano .env
```

Preencha:

```
DATABASE_URL="file:/home/ubuntu/norte/prod.db"
BRAPI_TOKEN="seu_token_brapi"      # opcional; vazio = só preço manual
```

Salve (Ctrl+O, Enter, Ctrl+X). O `.env` **não** vai pro git.

## 5. Provisionar (build + serviço)

```bash
cd ~/norte
bash scripts/provision.sh
```

O script: cria **2 GB de swap** (pro build caber em 1 GB de RAM), instala
**Node 22**, roda `npm ci`, aplica as migrações (`prisma migrate deploy`), faz o
`next build` e sobe o serviço **systemd** `norte`. Ao final mostra o status; o app
fica em `http://localhost:3000` (só dentro da máquina, por enquanto).

```bash
# conferir
curl -I http://localhost:3000          # deve responder 200
sudo systemctl status norte            # serviço ativo (Restart on-failure)
```

## 6. Tailscale + HTTPS

```bash
# instalar
curl -fsSL https://tailscale.com/install.sh | sh

# entrar na sua tailnet (abre uma URL p/ autenticar no navegador)
sudo tailscale up

# expor o app na tailnet, com HTTPS automático (porta 443 → localhost:3000)
sudo tailscale serve --bg 3000
sudo tailscale serve status            # mostra a URL https://norte.<sua-tailnet>.ts.net
```

> Se o `serve` reclamar de HTTPS, habilite **HTTPS Certificates** e **MagicDNS** no
> admin da Tailscale (Settings) e rode o `serve` de novo.

## 7. Validar pelo celular

1. Instale o app **Tailscale** no celular e entre na **mesma conta**.
2. Abra `https://norte.<sua-tailnet>.ts.net`. O Painel do Norte deve carregar com
   cadeado (HTTPS).
3. Importe um OFX/CSV ou faça um lançamento para confirmar que escreve no banco.

## 8. Atualizar depois de mudar o código

**Opção A (GitHub):**
```bash
cd ~/norte && git pull && bash scripts/provision.sh
```
**Opção B (tarball):** regere o `norte.tgz`, `scp` de novo, extraia sobre `~/norte`
e rode `bash scripts/provision.sh`. O `provision.sh` é idempotente (rebuild +
restart).

## 9. Operação

```bash
sudo systemctl restart norte           # reiniciar
sudo journalctl -u norte -f            # logs ao vivo
sudo systemctl status norte            # estado
```

O serviço sobe sozinho no boot e reinicia em falha.

## 10. Custos e desligar

- Dentro do Free Tier (1 micro 24/7, ≤30 GB, 12 meses) o custo tende a **zero**.
  Acompanhe em **Billing → Free Tier** e crie um **alerta de orçamento** (ex.: US$1).
- Depois de 12 meses a micro vira paga (~US$8–10/mês). Para pausar sem custo de
  computação: **Stop** a instância (o disco EBS continua, custo mínimo). Para zerar
  de vez: **Terminate** (apaga tudo — faça backup do `prod.db` antes).

## 11. Pendências (escopo §7, próximas fatias)

- **Backup automático** do `prod.db` (Litestream → bucket S3) — recomendado assim
  que o deploy estabilizar.
- **Cripto-em-repouso** dos tokens / fechar o SSH público em favor do Tailscale SSH.
- Enquanto isso, o dado autoritativo também vive na sua máquina local.
