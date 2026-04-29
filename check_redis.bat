@echo off
chcp 65001 >nul
title Check and Install Redis for Surf Champ
color 0A

echo =========================================
echo  Verificando e Instalando Redis para Windows
echo =========================================

echo Verificando se o Redis já está instalado...
where redis-server >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Redis já está instalado no sistema.
    goto CHECK_RUNNING
)

echo Redis não encontrado. Deseja instalar o Redis para Windows? (S/N)
set /p install=Resposta: 

if /i "%install%"=="S" (
    echo Baixando o Redis para Windows...
    curl -o redis-latest.zip https://github.com/tporadowski/redis/releases/download/v5.0.14.1/Redis-x64-5.0.14.1.zip
    
    if not exist "%ProgramFiles%\Redis" (
        mkdir "%ProgramFiles%\Redis"
    )
    
    echo Extraindo arquivos...
    "%ProgramFiles%\7-Zip\7z.exe" x redis-latest.zip -o"%ProgramFiles%\Redis" -y
    
    echo Adicionando ao PATH do sistema...
    setx PATH "%PATH%;%ProgramFiles%\Redis" /M
    
    echo Redis instalado com sucesso em %ProgramFiles%\Redis
) else (
    echo Instalação do Redis cancelada pelo usuário.
    echo O Redis é necessário para o funcionamento do rate limiting.
    pause
    exit /b 1
)

:CHECK_RUNNING
echo Verificando se o Redis está em execução...
tasklist /FI "IMAGENAME eq redis-server.exe" | find "redis-server.exe" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Redis já está em execução.
    pause
    exit /b 0
)

echo Iniciando o Redis...
start "Redis Server" /D "%ProgramFiles%\Redis" cmd /k "redis-server.exe"

echo.
echo Redis iniciado com sucesso na porta 6379.
echo Pressione qualquer tecla para continuar...
pause >nul
