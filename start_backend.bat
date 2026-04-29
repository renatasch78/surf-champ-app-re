@echo off
chcp 65001 >nul
title Surf Champ Backend (Java 21)

:: Definir o JAVA_HOME para o Java 21
set JAVA_HOME=C:\Program Files\Java\jdk-21
set PATH=%JAVA_HOME%\bin;%PATH%

echo =========================================
echo  Iniciando Surf Champ Backend com Java 17
echo =========================================

echo Verificando a versão do Java...
java -version

echo.
echo Iniciando a aplicação...
java -jar backend\target\surf-champ-1.0.0.jar

pause
