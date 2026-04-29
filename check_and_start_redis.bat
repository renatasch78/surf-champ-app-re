@echo off
chcp 65001 >nul
title Check and Start Redis for Surf Champ
echo =========================================
echo  Verificando e Iniciando Redis para Windows
echo =========================================

echo Verificando se o Redis já está em execução...
netstat -ano | findstr :6379 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Redis já está em execução na porta 6379.
    goto END
)

echo Redis não está em execução. Iniciando o Redis...
start "Redis Server" /D "C:\Redis" "C:\Redis\redis-server.exe" "C:\Redis\redis.windows.conf"

echo Aguardando o Redis iniciar...
timeout /t 2 >nul

netstat -ano | findstr :6379 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Redis iniciado com sucesso na porta 6379.
) else (
    echo Falha ao iniciar o Redis. Verifique se o Redis está instalado corretamente.
    echo Execute o script install_redis_simple.bat para instalar o Redis.
)

:END
echo.
pause
