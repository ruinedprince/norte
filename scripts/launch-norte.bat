@echo off
REM Sobe o servidor (escondido, se preciso) e abre o Norte como janela de app
REM no canto superior direito. Para auto-start no logon: install-autostart.bat.
powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0launch-norte.ps1"
