@echo off
chcp 65001 >nul
title Start Redis for Surf Champ
color 0A

echo =========================================
echo  Iniciando Redis para Windows
echo =========================================

echo Verificando se o Redis já está em execução...
tasklist /FI "IMAGENAME eq redis-server.exe" | find "redis-server.exe" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Redis já está em execução.
    pause
    exit /b 0
)

echo Iniciando o servidor Redis...
start "Redis Server" /D "%~dp0" cmd /k "redis-server.exe redis-windows.conf"

if %ERRORLEVEL% EQU 0 (
    echo Redis iniciado com sucesso na porta 6379.
) else (
    echo Erro ao iniciar o Redis. Verifique se o Redis está instalado corretamente.
    echo Execute install_redis.bat para instalar o Redis.
)

echo.
echo Pressione qualquer tecla para continuar...
pause >nul
