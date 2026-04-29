@echo off
setlocal

REM Check if Maven is installed
where mvn >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Maven is installed. Running with Maven...
    mvn spring-boot:run
) else (
    echo Maven is not installed. Checking for Maven Wrapper...
    if exist mvnw.cmd (
        echo Found Maven Wrapper. Running with Maven Wrapper...
        call mvnw.cmd spring-boot:run
    ) else (
        echo Error: Neither Maven nor Maven Wrapper found.
        echo Please install Maven or ensure the Maven Wrapper files are present.
        echo You can install Maven from: https://maven.apache.org/install.html
        pause
        exit /b 1
    )
)

endlocal
