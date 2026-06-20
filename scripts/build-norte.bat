@echo off
title Norte - build
cd /d "%~dp0.."

echo Instalando dependencias (se necessario)...
call npm install
if errorlevel 1 ( echo Falha no npm install & pause & exit /b 1 )

echo.
echo Gerando build de producao...
call npm run build
if errorlevel 1 ( echo Falha no build & pause & exit /b 1 )

echo.
echo Build concluido. Agora rode scripts\start-norte.bat (ou reinicie o Windows
echo se ja colocou o atalho na pasta Inicializar).
pause
