# Storylines: Detección de Fraude MLOps

## 1. The One Thing
- **What it is:** Un pipeline que procesa 6.3 millones de transacciones financieras mediante Dask sin desbordar memoria, exponiendo un microservicio FastAPI que evalúa el fraude en tiempo real.
- **The one thing to remember:** *"Entre millones de transacciones normales, encuentra la que vacía una cuenta, y lo hace en milisegundos."*
- **Hero Data:** `TXN-405011` — `TRANSFER` de $250,000 con vaciado de saldo origen a $0.00.

---

## Storylines

### ⭐ A. "Una entre 6.3 millones" (SELECCIONADA)
- **Dispositivo y Forma:** Ejemplo resuelto paso a paso + cadena objeto a objeto.
- **Sinopsis:** Una pared de filas contables desfila uniformemente; una sola fila (`TXN-405011`) experimenta un vaciado a $0.00 y cambia de tinta. La cámara la sigue mientras se fragmenta en un bloque Dask de 64MB, se computa su invariante contable (`errorBalanceOrig`), cruza la compuerta de validación Pydantic v2 y aterriza en el veredicto `CRÍTICO` del dashboard real.
- **Primeros 2 segundos:** Frame 0 lleno de filas contables desplazándose; en 1.2s la fila central se detiene, su saldo pasa de $250,000 a $0.00 en rojo de alta fidelidad.
- **Beats:** Hook (fila anómala) → Tensión (6.3M de registros colapsarían Pandas) → Revelación (Dask particiona en bloques de 64MB) → Prueba 1 (cálculo de `errorBalanceOrig`) → Prueba 2 (barrera Pydantic v2 y rechazo 422) → Payoff (Dashboard en vivo con veredicto CRÍTICO 89.4% / 99.6%) → Claim (Millones de filas. Una alerta. Milisegundos.) → End card (Luis Monge · GitHub Repo).
- **Look:** Industrial Minimalista: fondo frío técnico (#0a0e17 / #07090e), tipografía IBM Plex Sans + JetBrains Mono, acento rojo (#f87171 / #ef4444) exclusivo para la anomalía de fraude y el veredicto.
- **Sound:** Pulso electrónico sobrio (~100 BPM), clics secos de telemetría y golpe sordo de alerta en el veredicto.

### B. "La memoria se llena"
- **Dispositivo y Forma:** Antes y después + pantalla dividida que colapsa en una.
- **Sinopsis:** A la izquierda, la barra de RAM de Pandas se llena hasta provocar OOM; a la derecha, Dask streaming mantiene la memoria estable en ~350 MB. La pantalla dividida colapsa en Dask y sigue hacia la API.
- **Primeros 2 segundos:** Medidor de memoria al 90% con contador de filas subiendo vertiginosamente.
- **Beats:** Hook (RAM al límite) → Crash OOM → Dask estabiliza en 350MB → Inferencia FastAPI → Payoff → End card.

### C. "La fila"
- **Dispositivo y Forma:** El objeto es la explicación + toma continua anamórfica.
- **Sinopsis:** Una procesión de transacciones uniformes avanza hacia un portal de luz blanca (el microservicio). Una figura sufre aberración cromática y glitch al cruzar el portal.
- **Primeros 2 segundos:** Procesión en marcha hacia el portal luminoso en piso reflectante.
- **Beats:** Marcha uniforme → Portal de escaneo → Glitch en la anomalía → Entrada a la arquitectura interna → Salida al dashboard → End card.
