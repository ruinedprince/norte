# Norte — launcher. Starts the local production server (hidden, if not already
# running), waits until it answers, then opens Norte as a small, chromeless app
# window pinned to the TOP-RIGHT of the primary monitor. See docs/run-local.md.

$ErrorActionPreference = 'SilentlyContinue'
$root = Split-Path -Parent $PSScriptRoot
$url  = 'http://localhost:3000'

# --- ajuste aqui se quiser ----------------------------------------------------
$winW   = 480   # largura da janela (px)
$winH   = 860   # altura da janela (px)
$margin = 16    # folga das bordas da tela (px)
# ------------------------------------------------------------------------------

# 1. Sobe o servidor de produção em segundo plano se nada estiver na porta 3000.
$inUse = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if (-not $inUse) {
  Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'npm run start' `
    -WorkingDirectory $root -WindowStyle Hidden
}

# 2. Espera o servidor responder (até ~40s; o primeiro start de produção é rápido).
for ($i = 0; $i -lt 40; $i++) {
  try {
    if ((Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200) { break }
  } catch { Start-Sleep -Seconds 1 }
}

# 3. Calcula o canto superior direito a partir da área útil (sem a barra de tarefas).
Add-Type -AssemblyName System.Windows.Forms
$area = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
$x = $area.Right - $winW - $margin
$y = $area.Top + $margin

# 4. Abre como janela de app (sem abas/barra) — Edge primeiro, depois Chrome.
$browsers = @(
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
)
$browser = $browsers | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($browser) {
  & $browser "--app=$url" "--window-size=$winW,$winH" "--window-position=$x,$y"
} else {
  Start-Process $url   # sem Edge/Chrome: abre no navegador padrão, janela normal
}
