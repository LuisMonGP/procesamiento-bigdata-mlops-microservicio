@echo off
chcp 65001 > nul
title MLOps Fraud Detection Command Center - Lanzador Rapido

echo =========================================================================
echo   MLOps Big Data & Microservicio FastAPI - Deteccion de Fraude
echo   Autor: Luis Monge
echo =========================================================================
echo.

if not exist ".venv\Scripts\python.exe" (
    echo [ERROR] No se detecto el entorno virtual .venv.
    echo Por favor ejecuta primero: uv venv --python 3.11 ^&^& uv pip install -r requirements.txt
    pause
    exit /b 1
)

echo [1/3] Iniciando microservicio FastAPI en segundo plano en http://localhost:8000 ...
start /min "MLOps-FastAPI-Server" cmd /c ".venv\Scripts\python.exe -m uvicorn src.api:app --host 127.0.0.1 --port 8000"

timeout /t 2 /nobreak > nul

echo [2/3] Verificando conectividad con el microservicio ...
curl -s http://127.0.0.1:8000/health > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo       [OK] Microservicio saludable y respondiendo en el puerto 8000.
) else (
    echo       [AVISO] El microservicio esta cargando. Puedes usar el simulador integrado en el navegador.
)

echo [3/3] Abriendo Dashboard MLOps en tu navegador predeterminado ...
start "" "docs\index.html"

echo.
echo =========================================================================
echo   TODO LISTO:
echo   - Dashboard Visual: Abierto en tu navegador (docs\index.html)
echo   - Swagger API Docs: http://localhost:8000/docs
echo   - Probe de Salud:   http://localhost:8000/health
echo.
echo   Para detener el microservicio cuando termines, cierra la ventana
echo   minimizada 'MLOps-FastAPI-Server' o presiona cualquier tecla aqui.
echo =========================================================================
echo.
pause
taskkill /fi "WINDOWTITLE eq MLOps-FastAPI-Server*" /f > nul 2>&1
