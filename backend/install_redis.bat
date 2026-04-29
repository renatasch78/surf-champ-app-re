@echo off
chcp 65001 >nul
title Install and Start Redis for Surf Champ
color 0A

echo =========================================
echo  Instalando e Iniciando Redis para Windows
echo =========================================

echo Verificando se o Redis já está instalado...
where redis-server >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Redis já está instalado no sistema.
    goto START_REDIS
)

echo Baixando o Redis para Windows...
curl -o redis-latest.zip https://github.com/tporadowski/redis/releases/download/v5.0.14.1/Redis-x64-5.0.14.1.zip
if %ERRORLEVEL% NEQ 0 (
    echo Erro ao baixar o Redis. Verifique sua conexão com a internet.
    pause
    exit /b 1
)

echo Extraindo arquivos...
if not exist "C:\Program Files\Redis" (
    mkdir "C:\Program Files\Redis"
)
"C:\Program Files\7-Zip\7z.exe" x redis-latest.zip -o"C:\Program Files\Redis" -y
if %ERRORLEVEL% NEQ 0 (
    echo Erro ao extrair o Redis. Verifique se o 7-Zip está instalado.
    pause
    exit /b 1
)

setx PATH "%PATH%;C:\Program Files\Redis" /M
if %ERRORLEVEL% NEQ 0 (
    echo Aviso: Não foi possível adicionar o Redis ao PATH do sistema.
    echo Você precisará adicionar manualmente C:\Program Files\Redis ao PATH do sistema.
)

:START_REDIS
echo Iniciando o servidor Redis...
start "Redis Server" /D "C:\Program Files\Redis" cmd /k "redis-server.exe redis-windows.conf"

if %ERRORLEVEL% EQU 0 (
    echo Redis iniciado com sucesso na porta 6379.
) else (
    echo Erro ao iniciar o Redis. Verifique se a porta 6379 já está em uso.
)

echo.
echo Pressione qualquer tecla para continuar...
pause >nul
