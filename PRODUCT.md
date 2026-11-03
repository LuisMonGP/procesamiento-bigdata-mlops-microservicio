# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Evaluadores técnicos, líderes de ingeniería y reclutadores MLOps**: Analizan la solvencia técnica del proyecto en situaciones de evaluación de talento, arquitectura de datos y contratación de perfiles Senior MLOps / Data Engineer. Su trabajo consiste en verificar que la solución implementa ingeniería robusta (control de memoria, contratos de API estrictos, pipelines reproducibles y suites de tests).
- **Ingenieros de Datos y Desarrolladores Backend**: Consultan la implementación como blueprint de referencia para integrar Dask out-of-core, FastAPI asíncrono, persistencia NoSQL e integración continua.

## Product Purpose

Demostrar en vivo una solución de nivel de producción para el procesamiento masivo de datos financieros y detección de fraude en tiempo real. Resuelve la disyuntiva entre procesar volúmenes masivos de datos (PaySim1, +6.3M de registros) sin desbordar memoria RAM local (Out-Of-Memory) y servir inferencia REST con latencia P95 inferior a 50 ms mediante un microservicio contenedorizado. El éxito se define como la capacidad del evaluador de interactuar con el simulador en vivo en GitHub Pages, comprobar el cumplimiento de los contratos de validación y auditar la suite de pruebas automatizadas.

## Positioning

A diferencia de proyectos MLOps teóricos o notebooks aislados, este producto une una arquitectura distribuida real (Dask DAG con particiones out-of-core de 64 MB), persistencia híbrida en MongoDB con fallback mock sin dependencias duras externas, y un simulador interactivo de cliente en el navegador que valida rigurosamente las cargas con las mismas invariantes financieras (`errorBalanceOrig`, esquemas Pydantic v2 y rechazo `HTTP 422`).

## Operating Context

- **Navegadores web modernos**: Interacción con el dashboard visual en GitHub Pages (`luismongp.github.io/procesamiento-bigdata-mlops-microservicio`).
- **Entorno de Contenedores y CLI**: Ejecución reproducible con `docker-compose up --build` o arranque local vía `uvicorn src.api:app`.
- **Pipeline de Integración Continua (CI/CD)**: Flujo de trabajo en GitHub Actions (`.github/workflows/deploy-pages.yml`) para despliegue automatizado del dashboard estático y ejecución de pruebas con `pytest`.
- **Ecosistema de Datos**: Dataset financiero PaySim1, colecciones indexadas en MongoDB y almacenamiento de respaldo en formato Parquet.

## Capabilities and Constraints

- **Capacidades Confirmadas**:
  - Simulación interactiva del endpoint `POST /predict` con cálculo reactivo de discrepancia de balance (`errorBalanceOrig = newbalanceOrig + amount - oldbalanceOrg`).
  - Validación de esquemas con Pydantic v2: restricción de `amount > 0` y tipos estrictos.
  - Procesamiento perezoso (Lazy Evaluation) con Dask (`dd.read_csv`, `blocksize="64MB"`, `assign`, `map_partitions`).
  - Persistencia híbrida en MongoDB con fallback automático en memoria para entornos de CI/CD o sin servicio activo.
  - Suite de pruebas unitarias y de integración automatizadas con `pytest` y `TestClient` de FastAPI.
- **Restricciones Técnicas**:
  - El frontend en GitHub Pages es estático (HTML5, CSS moderno, Vanilla JS); no ejecuta un servidor Python en vivo, por lo que la simulación de inferencia y validación emula fidedignamente el contrato del microservicio local.
  - La latencia SLA de producción del microservicio local debe mantenerse por debajo de los 50 ms (P95 verificado en 1.45 ms).

## Brand Commitments

- **Nombre del Proyecto**: `procesamiento-bigdata-mlops-microservicio` / Big Data Out-of-Core & Microservicio MLOps con FastAPI.
- **Autor**: Luis Monge.
- **Tono y Voz**: Riguroso, técnico, analítico y centrado en la excelencia de ingeniería.
- **Identidad Visual**: Modo oscuro técnico de alta densidad informativa, acentos en esmeralda (`#10b981`), carmesí de alerta (`#ef4444`) y cian técnico (`#38bdf8`), con tipografías `Inter` y monoespaciadas (`JetBrains Mono`).

## Evidence on Hand

- Código fuente completo y funcional en `src/` (`api.py`, `dask_pipeline.py`, `database.py`).
- Suite de pruebas automatizadas en `tests/` (`test_api.py`, `test_dask.py`, `test_database.py`).
- Interfaz interactiva y estilos en `docs/index.html` y `docs/styles.css`.
- Especificación arquitectónica y visual en `PLAN_VISUAL_GITHUB_PAGES.md` y `README.md`.
- Configuración de contenedores en `Dockerfile` y `docker-compose.yml`.

## Product Principles

1. **Fidelidad al Contrato Técnico**: Toda interacción visual o simulada debe respetar los esquemas e invariantes del microservicio de producción (validación estricta, códigos HTTP estandarizados y lógica de dominio financiera).
2. **Claridad sobre la Arquitectura Distribuida**: Visualizar con rigor el comportamiento out-of-core de Dask (particiones por bloques, reducción de uso de RAM de 8.5 GB a ~350 MB) sin recurrir a conceptos oscuros o cajas negras.
3. **Cero Dependencias Bloqueantes**: Demostración y evaluación autosuficientes tanto en navegador web (GitHub Pages) como en pruebas automatizadas locales con fallback resiliente.
4. **Acabado de Ingeniería Impecable**: Código limpio, documentación completa bajo metodología CRISP-DM, tipografía técnica jerarquizada y accesibilidad en cada control de usuario.

## Accessibility & Inclusion

- Contraste visual adecuado sobre fondos oscuros (cumplimiento WCAG AA).
- Soporte para navegación por teclado con foco visible (`:focus-visible`).
- Etiquetas ARIA semánticas en regiones interactivas y formularios de simulación de transacciones.
