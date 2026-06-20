@echo off
title Norte
cd /d "%~dp0.."

if not exist ".next" (
  echo.
  echo Build de producao nao encontrado.
  echo Rode primeiro: scripts\build-norte.bat
  echo.
  pause
  exit /b 1
)

echo.
echo Norte rodando em http://localhost:3000
echo Feche esta janela para parar o app.
echo.
call npm run start
