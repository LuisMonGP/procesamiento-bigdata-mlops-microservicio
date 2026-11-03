# Video Specification: MLOps Fraud Detection & Dask Out-of-Core

GOAL:    El reclutador o líder técnico entiende que este pipeline procesa millones de filas sin saturar la RAM y frena el fraude en milisegundos con contratos Pydantic v2, incitándolo a probar el dashboard.
OUTPUT:  HyperFrames, 1920 x 1080, 30 fps
TIME:    45 s x 30 = 1350 frames; 100 BPM = 18 frames por beat
LOOK:    ground: #07090e, container: #0d1117, border: rgba(255, 255, 255, 0.10);
         display face: 'IBM Plex Sans', 700 weight, 84px max, tracking -0.02em;
         mono face: 'JetBrains Mono', 500 weight, 30px, tracking 0.0em;
         ink: #f1f5f9, muted: #94a3b8;
         accents: #38bdf8 (cian técnico), #f87171 (rojo alerta solo para fraude y error 422), #10b981 (verde aprobado);
         medium: UI de producción y telemetría de ingeniería de datos real;
         lighting: sombras limpias con offset (0 8px 24px rgba(0, 0, 0, 0.45)), sin resplandores difusos ('dark-glow');
OBJECTS: Libro de transacciones PaySim1; bloque particionado de Dask (64MB streaming);
         fórmula matemática errorBalanceOrig; contrato JSON Pydantic v2; barrera HTTP 422;
         dashboard MLOps real con diagnóstico de negocio y telemetría en vivo;
MOTION:  eases: power4.out (entradas nítidas), power2.inOut (movimientos de cámara y transiciones de bloque);
         durations: cambios de ritmo cada 4-6 segundos sincronizados con el beat;
SHOTS:
  S1  0-150    (0.0s - 5.0s)  Hook: Desfile de transacciones financieras uniformes. TXN-405011 se detiene y su saldo cae a $0.00 en rojo de alta tensión.
  S2  150-330  (5.0s - 11.0s) Tensión: 6.3 millones de transacciones. Cargar la data con Pandas saturaría la memoria RAM (Riesgo OOM).
  S3  330-510  (11.0s - 17.0s) Revelación: Dask construye un DAG perezoso y procesa en streaming por bloques de 64MB (~350MB RAM constante).
  S4  510-720  (17.0s - 24.0s) Prueba 1: Feature Engineering vectorizado. Cálculo en vivo de la discrepancia de balance errorBalanceOrig.
  S5  720-930  (24.0s - 31.0s) Prueba 2: Microservicio FastAPI asíncrono con Pydantic v2. Demostración de barrera ante cargas corruptas (HTTP 422).
  S6  930-1140 (31.0s - 38.0s) Payoff: Dashboard real en acción. Latencia sub-milisegundo, veredicto CRÍTICO 99.6% y diagnóstico de negocio en lenguaje humano.
  S7  1140-1260(38.0s - 42.0s) Claim: "6.3 Millones de Registros · Inferencia en < 1.5 ms · Contratos Estrictos"
  S8  1260-1350(42.0s - 45.0s) End Card: "MLOps Command Center · Por Luis Monge · Demo en Vivo en GitHub Pages"
BANNED:  fondo negro vacío con partículas flotantes; resplandores difusos dark-glow; tarjetas anidadas;
         fuentes genéricas de IA; textos que se mueven mientras se leen; cifras de RAM sin marcar 'estimado';
         logotipo pegado en una esquina.
QA:      f60 (fila roja resaltada), f240 (6.3M de registros), f420 (bloque 64MB), f600 (fórmula calculada),
         f820 (barrera 422), f1050 (dashboard CRÍTICO), f1300 (end card legible).
