# Cria (ou atualiza) um atalho na pasta Inicializar do Windows que roda o
# launcher do Norte, escondido, a cada logon. Reversível: apague o Norte.lnk.

$startup = [Environment]::GetFolderPath('Startup')
$lnk = Join-Path $startup 'Norte.lnk'
$launcher = Join-Path $PSScriptRoot 'launch-norte.ps1'
$psExe = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'

$ws = New-Object -ComObject WScript.Shell
$sc = $ws.CreateShortcut($lnk)
$sc.TargetPath = $psExe
$sc.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$launcher`""
$sc.WorkingDirectory = (Split-Path -Parent $PSScriptRoot)
$sc.Save()

Write-Host "Auto-start instalado:" $lnk
Write-Host "Para desfazer, apague esse arquivo (Win+R -> shell:startup)."
