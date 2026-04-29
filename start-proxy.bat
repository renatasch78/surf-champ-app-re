@echo off
title Surf Champ Proxy Server
color 0B

echo ==================================================
echo  Iniciando Surf Champ Proxy Server
echo ==================================================
echo.

REM Change to the proxy directory
cd /d "D:\Examples\surf_champ_app\backend_proxy"

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Erro: Node.js nÆo est  instalado ou nÆo est  no PATH.
    echo Por favor, instale o Node.js de: https://nodejs.org/
    pause
    exit /b 1
)

echo Instalando dependŒncias...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Erro ao instalar as dependŒncias.
    pause
    exit /b 1
)

echo.
echo Iniciando o servidor proxy...
echo.

REM Start the proxy server
node index.js

REM This keeps the window open if the command fails
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Ocorreu um erro ao iniciar o servidor proxy.
)

echo.
pause
