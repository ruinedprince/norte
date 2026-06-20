# Rodar o Norte como app local (sem servidor, sem custo)

Como manter o Norte sempre à mão na **sua própria máquina**, de graça e sem deploy:
ele sobe sozinho quando você liga o PC e abre como um "app" com janela própria.
Funciona porque o Norte é local-first — só você acessa, na sua máquina.

> Limite honesto: o Norte fica disponível **enquanto o seu PC estiver ligado**
> (como qualquer programa local). Para 24/7 com o PC desligado, aí sim precisaria
> de um servidor — veja [`docs/deploy.md`](deploy.md).

## 1. Setup (uma vez)

1. Garanta o arquivo **`.env`** na raiz do projeto com:
   ```
   DATABASE_URL="file:./dev.db"
   BRAPI_TOKEN=""    # opcional; sem token, preço manual
   ```
   (já existe do desenvolvimento — o `.env` é gitignored e guarda seus dados/segredos).
2. Gere o build de produção: dê **dois cliques em `scripts\build-norte.bat`**
   (ou rode `npm install && npm run build`).

## 2. Ligar

Dois cliques em **`scripts\start-norte.bat`**. Ele sobe o Norte em
`http://localhost:3000` (a janela preta é o app rodando — fechar = parar).

## 3. Subir sozinho no logon

1. `Windows + R` → digite **`shell:startup`** → Enter (abre a pasta *Inicializar*).
2. Crie ali um **atalho** para `scripts\start-norte.bat` (botão direito →
   *Novo → Atalho* → aponte para o `.bat`).
3. (Opcional) No atalho → *Propriedades → Executar: Minimizada*, para não ficar
   uma janela grande na tela.

Pronto: a cada logon o Norte sobe em segundo plano.

## 4. Instalar como "app" (janela própria + ícone)

- **Edge:** abra `http://localhost:3000` → menu `…` → **Aplicativos** →
  **Instalar este site como um aplicativo** → nome "Norte".
- **Chrome:** menu `…` → **Transmitir, salvar e compartilhar → Instalar página
  como app** (ou *Mais ferramentas → Criar atalho → marcar "Abrir como janela"*).

Vira um ícone no Menu Iniciar / Área de trabalho que abre o Norte numa janela
limpa, sem barra de endereço — cara de programa de verdade.

## 5. Atualizar (após mudanças no código)

1. Dois cliques em `scripts\build-norte.bat` (rebuild).
2. Feche a janela do Norte e rode `scripts\start-norte.bat` de novo (ou re-logue).

## 6. Parar

Feche a janela do `start-norte.bat`. (Ou *Gerenciador de Tarefas* → finalize o
processo **node**.)

## 7. Acessar do celular (opcional, grátis)

Mesma rede privada, sem custo nem porta pública:

1. Instale a **Tailscale** no PC e no celular (mesma conta).
2. Com o PC ligado, no celular abra `http://<nome-do-pc-na-tailscale>:3000`.
3. Para HTTPS: `tailscale serve --bg 3000` (detalhes em [`docs/deploy.md`](deploy.md) §6).

## 8. Backup dos dados

Seus lançamentos ficam em **`dev.db`** na raiz (gitignored — dado financeiro,
nunca vai pro git). Copie esse arquivo de tempos em tempos para um lugar seguro.
