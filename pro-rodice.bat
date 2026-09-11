@echo off
chcp 65001 >nul
title Pro rodice
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto nonode

echo.
echo   Otviram prehled pro rodice.
echo   Kdyz uz program bezi, jen se otevre prohlizec.
echo.

node server.js --open-parents

echo.
pause
exit /b 0

:nonode
echo.
echo   Nenasel jsem Node.js. Stahni ho zdarma z https://nodejs.org
echo.
pause
exit /b 1
