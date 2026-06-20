@echo off
title Norte - instalar auto-start
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-autostart.ps1"
echo.
echo Pronto. No proximo logon o Norte sobe e abre sozinho no canto superior direito.
pause
