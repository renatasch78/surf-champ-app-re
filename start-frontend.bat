@echo off
title Surf Champ Frontend
color 0E

echo ==================================================
echo  Iniciando Surf Champ Frontend
echo ==================================================
echo.

REM Change to the frontend directory
cd /d "D:\Examples\surf_champ_app\frontend"

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
echo Iniciando o servidor de desenvolvimento...
echo.

REM Start the development server
call npm start

REM This keeps the window open if the command fails
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Ocorreu um erro ao iniciar o servidor de desenvolvimento.
)

echo.
pause
