# Rodar o Norte como app local (sem servidor, sem custo)

Como manter o Norte sempre à mão na **sua própria máquina**, de graça e sem deploy:
ele sobe sozinho no logon e abre como uma **janela pequena no canto superior
direito**, sem barra de endereço — cara de app. Funciona porque o Norte é
local-first: só você acessa, na sua máquina.

> Limite honesto: o Norte fica disponível **enquanto o seu PC estiver ligado**
> (como qualquer programa local). Para 24/7 com o PC desligado, aí sim precisaria
> de um servidor — veja [`docs/deploy.md`](deploy.md).

## 1. Setup (uma vez) — build

1. Garanta o arquivo **`.env`** na raiz do projeto com:
   ```
   DATABASE_URL="file:./dev.db"
   BRAPI_TOKEN=""    # opcional; sem token, preço manual
   ```
   (já existe do desenvolvimento — o `.env` é gitignored e guarda seus dados/segredos).
2. Gere o build de produção: **dois cliques em `scripts\build-norte.bat`**
   (ou rode `npm install && npm run build`).

## 2. Abrir agora (teste manual)

Dois cliques em **`scripts\launch-norte.bat`**. Ele:
- sobe o servidor em segundo plano (sem janela preta) se ele ainda não estiver no ar;
- espera ficar pronto e **abre o Norte numa janela pequena, encostada no canto
  superior direito** da tela.

## 3. Abrir sozinho no logon (auto-start)

Dois cliques em **`scripts\install-autostart.bat`** (uma vez). Ele cria um atalho
na pasta *Inicializar* do Windows apontando para o launcher.

A partir do **próximo logon**, o Norte sobe e abre sozinho, no canto superior
direito — sem você fazer nada.

> Desfazer o auto-start: `Win+R` → `shell:startup` → apague o arquivo **`Norte.lnk`**.

## 4. Ajustar tamanho / posição da janela

Edite o topo de **`scripts\launch-norte.ps1`**:
```
$winW   = 480   # largura (px)
$winH   = 860   # altura (px)
$margin = 16    # folga das bordas
```
A janela fica sempre ancorada no canto superior direito; mude os números se
quiser maior/menor ou mais longe da borda.

## 5. Atualizar (após mudanças no código)

1. `scripts\build-norte.bat` (rebuild).
2. Pare o servidor (seção 6) e rode `scripts\launch-norte.bat` de novo — ou só
   re-logue.

## 6. Parar o servidor

A janela do app e o servidor são separados: **fechar a janela não para o
servidor** (ele roda escondido). Para parar de fato: *Gerenciador de Tarefas* →
finalize o processo **node** (ou reinicie o PC).

> Alternativa "tudo numa janela só": `scripts\start-norte.bat` roda o servidor
> num console visível — aí fechar o console para o servidor. Útil se você não
> quer o launcher (ex.: só servir pro celular, sem abrir janela no PC).

## 7. Ícone fixo no Menu Iniciar (opcional)

O launcher já abre em modo app. Se quiser **também** um ícone fixo:
- **Edge:** abra `http://localhost:3000` → `…` → **Aplicativos → Instalar este
  site como um aplicativo**.
- **Chrome:** `…` → **Transmitir, salvar e compartilhar → Instalar página como app**.

## 8. Acessar do celular (opcional, grátis)

Mesma rede privada, sem custo nem porta pública:

1. Instale a **Tailscale** no PC e no celular (mesma conta).
2. Com o PC ligado, no celular abra `http://<nome-do-pc-na-tailscale>:3000`.
3. Para HTTPS: `tailscale serve --bg 3000` (detalhes em [`docs/deploy.md`](deploy.md) §6).

## 9. Backup dos dados

Seus lançamentos ficam em **`dev.db`** na raiz (gitignored — dado financeiro,
nunca vai pro git). Copie esse arquivo de tempos em tempos para um lugar seguro.
