@echo off
chcp 65001 >nul
title Piseme vsemi deseti
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto nonode

echo.
echo   Spoustim program. Toto okno nechej otevrene.
echo   Az budete hotovi, zavri ho nebo stiskni Ctrl+C.
echo.

node server.js --open

echo.
echo   Program skoncil.
pause
exit /b 0

:nonode
echo.
echo   Nenasel jsem Node.js. Stahni ho zdarma z https://nodejs.org,
echo   nainstaluj a spust tento soubor znovu.
echo.
pause
exit /b 1
