# Plan Visual y Despliegue en GitHub Pages
## Proyecto: Procesamiento Big Data & Microservicio MLOps (`procesamiento-bigdata-mlops-microservicio`)

Este documento define la arquitectura técnica y visual del panel web interactivo diseñado para ejecutarse en **GitHub Pages** (`https://luismongp.github.io/procesamiento-bigdata-mlops-microservicio/`), permitiendo a reclutadores, líderes técnicos y auditores interactuar en tiempo real con la lógica del microservicio de detección de fraude y visualizar la computación distribuida de Dask.

---

## 1. Objetivos del Despliegue

1. **Simulación en Tiempo Real del Microservicio MLOps**: Permitir probar en vivo el contrato `POST /predict` (validado por `Pydantic v2`) directamente en el navegador mediante lógica compilada en JavaScript/WebAssembly o llamadas simuladas con latencia real de red.
2. **Visualización Interactiva del Pipeline Big Data (Dask Lazy DAG)**: Explicar didácticamente cómo la computación distribuida particiona datasets masivos (PaySim1) sin desbordar la memoria RAM.
3. **Explorador de Arquitectura y Docker**: Presentar el diagrama de contenedores, la persistencia híbrida en MongoDB NoSQL y las suites de pruebas automatizadas en `pytest`.

---

## 2. Identidad Visual y Estética de Diseño

- **Paleta de Colores**:
  - Fondo Base: `#080b11` (Obsidiana Profunda / Dark Canvas).
  - Acento Principal: `#10b981` (Esmeralda / MLOps Health & Transacción Aprobada).
  - Acento Alerta: `#ef4444` (Rojo Carmesí / Fraude Financiero Detectado).
  - Acento Técnico: `#38bdf8` (Azul Cian / Nodos Dask & Ingesta).
  - Tipografía: `Inter` para jerarquía ejecutiva y `JetBrains Mono` / `Fira Code` para telemetría y payloads JSON.

---

## 3. Módulos del Dashboard Interactivo

### Módulo A: Simulador de Inferencia de Fraude (`POST /predict`)
- **Inputs Interactivos**:
  - Tipo de Transacción (`TRANSFER`, `CASH_OUT`, `PAYMENT`, `DEBIT`).
  - Monto de la Transacción (`amount`).
  - Saldo de Origen Previo (`oldbalanceOrg`) y Posterior (`newbalanceOrig`).
  - Saldo de Destino Previo (`oldbalanceDest`) y Posterior (`newbalanceDest`).
- **Lógica Reactiva en Vivo**:
  - Cálculo instantáneo de la invariante:
    $$\text{errorBalanceOrig} = \text{newbalanceOrig} + \text{amount} - \text{oldbalanceOrg}$$
  - Generación del payload JSON validado según el esquema Pydantic:
    ```json
    {
      "step": 1,
      "type": "TRANSFER",
      "amount": 181.0,
      "nameOrig": "C1231006815",
      "oldbalanceOrg": 181.0,
      "newbalanceOrig": 0.0,
      "nameDest": "C553264065",
      "oldbalanceDest": 0.0,
      "newbalanceDest": 0.0
    }
    ```
  - Veredicto visual:
    - Badge animado con probabilidad de fraude ($P(\text{fraude}) \in [0.0, 1.0]$).
    - Explicación de los disparadores (e.g., *Vaciado completo de cuenta origen en un solo paso*).

### Módulo B: Visualizador de Computación Distribuida Dask
- Gráfico interactivo que representa el Grafo Acíclico Dirigido (DAG):
  - Ingesta por bloques (`blocksize="64MB"`).
  - Enriquecimiento vectorial de características (`assign`).
  - Agregaciones paralelas (`map_partitions`).
  - Consolidación (`compute()`).
- Comparador visual de consumo de memoria:
  - *Pandas Clásico*: Pico de 8.5 GB RAM (Riesgo OOM en contenedores pequeños).
  - *Dask Out-of-Core*: Flujo constante de ~350 MB RAM por partición.

### Módulo C: Consola de Persistencia MongoDB & Arquitectura Docker
- Visualizador de esquemas de colecciones NoSQL (`transacciones_fraude`) con indexación por `step` y `isFraud`.
- Inspección interactiva de `Dockerfile` multinivel y orquestación con `docker-compose.yml`.

---

## 4. Estructura de Archivos en el Repositorio

```
procesamiento-bigdata-mlops-microservicio/
├── .github/
│   └── workflows/
│       └── deploy-pages.yml         # Despliegue automático a GitHub Pages
├── docs/                             # Código fuente de la web estática
│   ├── index.html                   # Dashboard interactivo principal
│   ├── styles.css                   # Estilos modernos fintech
│   ├── app.js                       # Motor reactivo y simulador de inferencia
│   └── assets/                      # Diagramas arquitectónicos y logos
├── src/                             # Código Python de producción (FastAPI, Dask, MongoDB)
├── tests/                           # Pruebas unitarias y de integración
└── README.md
```

---

## 5. Pipeline de CI/CD para GitHub Pages (`deploy-pages.yml`)

```yaml
name: Deploy GitHub Pages

on:
  push:
    branches: [ main ]
    paths:
      - 'docs/**'
      - '.github/workflows/deploy-pages.yml'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: 'docs'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## 6. Próximos Pasos para su Implementación

1. Crear la carpeta `docs/` con `index.html`, `styles.css` y `app.js`.
2. Crear `.github/workflows/deploy-pages.yml`.
3. Probar localmente abriendo `docs/index.html` en el navegador.
4. Realizar commit y push a GitHub (`LuisMonGP/procesamiento-bigdata-mlops-microservicio`).
5. Activar GitHub Pages en la pestaña **Settings -> Pages -> Build and deployment -> Source: GitHub Actions**.
