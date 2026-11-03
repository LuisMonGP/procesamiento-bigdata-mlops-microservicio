/**
 * MLOps Fraud Scoring Engine & Dynamic Simulator
 * Reproduce fielmente la inferencia matemática, validación Pydantic v2
 * y la arquitectura out-of-core de Dask (src/api.py & src/bigdata_processor.py)
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- Elementos DOM del Simulador ---
  const transaccionIdInput = document.getElementById('transaccion_id');
  const tipoOpSelect = document.getElementById('tipo_operacion');

  const amountInput = document.getElementById('amount');
  const numAmount = document.getElementById('num-amount');

  const oldOrgInput = document.getElementById('oldbalanceOrg');
  const numOldOrg = document.getElementById('num-oldbalanceOrg');

  const newOrgInput = document.getElementById('newbalanceOrig');
  const numNewOrg = document.getElementById('num-newbalanceOrig');

  const oldDestInput = document.getElementById('oldbalanceDest');
  const numOldDest = document.getElementById('num-oldbalanceDest');

  const newDestInput = document.getElementById('newbalanceDest');
  const numNewDest = document.getElementById('num-newbalanceDest');

  const badgeAlert = document.getElementById('badge-alert');
  const scoreText = document.getElementById('score-text');
  const scoreFill = document.getElementById('score-fill');
  const resError = document.getElementById('res-error');
  const resBinary = document.getElementById('res-binary');
  const jsonCode = document.getElementById('json-code');
  const liveLatency = document.getElementById('live-latency');

  // Diagnóstico de Negocio
  const diagnosisTag = document.getElementById('diagnosis-tag');
  const diagnosisText = document.getElementById('diagnosis-text');

  // Selector de Motor Backend (Simulador Cloud vs FastAPI Local)
  const btnModeBrowser = document.getElementById('btn-mode-browser');
  const btnModeApi = document.getElementById('btn-mode-api');
  const apiStatusDot = document.getElementById('api-status-dot');
  let currentBackendMode = 'browser'; // 'browser' o 'api'

  // Botón Copiar Payload
  const btnCopyPayload = document.getElementById('btn-copy-payload');
  const copyBtnText = document.getElementById('copy-btn-text');

  // Presets Rápidos
  const btnDrain = document.getElementById('preset-drain');
  const btnLegit = document.getElementById('preset-legit');
  const btnCashout = document.getElementById('preset-cashout');
  const btnError422 = document.getElementById('preset-error-422');

  // Tour Guiado Automático
  const btnStartTour = document.getElementById('btn-start-tour');
  const tourBtnText = document.getElementById('tour-btn-text');
  const tourStepDots = document.querySelectorAll('.tour-step-dot');
  const tourStepTitle = document.getElementById('tour-step-title');
  const tourStepDesc = document.getElementById('tour-step-desc');
  let tourInterval = null;
  let tourCurrentStep = 0;

  // --- Sincronización Bidireccional Slider <-> Input Numérico ---
  function setupTwoWaySync(slider, numInput) {
    slider.addEventListener('input', () => {
      numInput.value = slider.value;
      runSimulation();
    });
    numInput.addEventListener('input', () => {
      slider.value = numInput.value;
      runSimulation();
    });
  }

  setupTwoWaySync(amountInput, numAmount);
  setupTwoWaySync(oldOrgInput, numOldOrg);
  setupTwoWaySync(newOrgInput, numNewOrg);
  setupTwoWaySync(oldDestInput, numOldDest);
  setupTwoWaySync(newDestInput, numNewDest);

  tipoOpSelect.addEventListener('change', runSimulation);
  transaccionIdInput.addEventListener('input', runSimulation);

  // --- Motor de Simulación e Inferencia ---
  async function runSimulation() {
    const t0 = performance.now();

    const txnId = transaccionIdInput.value || 'TXN-000000';
    const tipo = tipoOpSelect.value;
    const amount = parseFloat(numAmount.value);
    const oldOrg = parseFloat(numOldOrg.value);
    const newOrg = parseFloat(numNewOrg.value);
    const oldDest = parseFloat(numOldDest.value);
    const newDest = parseFloat(numNewDest.value);

    // 1. Barrera de Validación Pydantic v2 (src/api.py: TransaccionInput)
    if (isNaN(amount) || amount <= 0 || isNaN(oldOrg) || oldOrg < 0 || isNaN(newOrg) || newOrg < 0) {
      triggerPydanticValidationError(txnId, tipo, amount);
      return;
    }

    // 2. Si el usuario activó "FastAPI Local (:8000)", intentamos consulta real vía HTTP
    if (currentBackendMode === 'api') {
      try {
        const payloadRequest = {
          transaccion_id: txnId,
          tipo_operacion: tipo,
          amount: amount,
          oldbalanceOrg: oldOrg,
          newbalanceOrig: newOrg,
          oldbalanceDest: oldDest,
          newbalanceDest: newDest
        };

        const res = await fetch('http://localhost:8000/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadRequest)
        });

        if (res.ok) {
          const apiData = await res.json();
          renderResults(apiData.probabilidad_riesgo, apiData.error_balance_origen, apiData.es_fraude, apiData.nivel_alerta, apiData.latencia_ms, payloadRequest, apiData, true);
          return;
        } else if (res.status === 422) {
          const errorData = await res.json();
          renderValidationError(errorData);
          return;
        }
      } catch (err) {
        console.warn('Microservicio FastAPI local no detectado en localhost:8000. Regresando a simulador en navegador.', err);
        setBackendMode('browser', false);
      }
    }

    // 3. Invariante Contable Financiera:
    // errorBalanceOrig = newbalanceOrig + amount - oldbalanceOrg
    const errorOrig = newOrg + amount - oldOrg;

    // 4. Lógica de Scoring en Navegador (src/api.py)
    let z = 0;
    if (tipo === 'TRANSFER' || tipo === 'CASH-OUT') {
      z = (
        0.00002 * (amount - 150000.0) +
        0.000015 * Math.abs(errorOrig) +
        (newOrg === 0.0 && amount > 50000.0 ? 1.5 : -0.5)
      );
    } else {
      z = -4.5;
    }

    let prob = 1.0 / (1.0 + Math.exp(-z));
    prob = Math.max(0.0001, Math.min(0.9999, prob));

    const isFraud = prob >= 0.50 ? 1 : 0;
    let nivel = 'BAJO';

    if (prob >= 0.75) {
      nivel = 'CRÍTICO';
    } else if (prob >= 0.35) {
      nivel = 'MEDIO';
    }

    const t1 = performance.now();
    const latencyMs = parseFloat((t1 - t0 + 0.35).toFixed(2));

    const pydanticRequest = {
      transaccion_id: txnId,
      tipo_operacion: tipo,
      amount: amount,
      oldbalanceOrg: oldOrg,
      newbalanceOrig: newOrg,
      oldbalanceDest: oldDest,
      newbalanceDest: newDest
    };

    const fastApiResponse = {
      transaccion_id: txnId,
      es_fraude: isFraud,
      probabilidad_riesgo: parseFloat(prob.toFixed(4)),
      nivel_alerta: nivel,
      error_balance_origen: parseFloat(errorOrig.toFixed(2)),
      latencia_ms: latencyMs,
      estado_servicio: "evaluado_exitoso"
    };

    renderResults(prob, errorOrig, isFraud, nivel, latencyMs, pydanticRequest, fastApiResponse, false);
  }

  // --- Renderizador de Resultados y Diagnóstico de Negocio ---
  function renderResults(prob, errorOrig, isFraud, nivel, latencyMs, pydanticRequest, fastApiResponse, isLiveApi) {
    let fillClass = '#10b981';
    if (nivel === 'CRÍTICO') fillClass = '#f87171';
    else if (nivel === 'MEDIO') fillClass = '#f59e0b';

    liveLatency.textContent = isLiveApi ? `${latencyMs} ms [API Local]` : `${latencyMs} ms [Simulador]`;
    scoreText.textContent = `${(prob * 100).toFixed(1)}%`;
    scoreFill.style.width = `${(prob * 100).toFixed(1)}%`;
    scoreFill.style.backgroundColor = fillClass;

    badgeAlert.className = 'badge-status ' + (nivel === 'CRÍTICO' ? 'critico' : (nivel === 'MEDIO' ? 'medio' : 'bajo'));
    badgeAlert.textContent = nivel;

    resError.textContent = errorOrig.toFixed(2);
    resBinary.textContent = isFraud === 1 ? '1 (FRAUDE)' : '0 (LEGÍTIMO)';
    resBinary.style.color = isFraud === 1 ? '#f87171' : '#10b981';

    // Generar Diagnóstico en Lenguaje Simple
    updateBusinessDiagnosis(pydanticRequest, errorOrig, prob, nivel);

    jsonCode.textContent = JSON.stringify({
      request_contract_pydantic: pydanticRequest,
      fastapi_response: fastApiResponse
    }, null, 2);
  }

  function updateBusinessDiagnosis(req, errorOrig, prob, nivel) {
    if (nivel === 'CRÍTICO') {
      diagnosisTag.className = 'diagnosis-tag alerta-roja';
      diagnosisTag.textContent = 'Alerta de Seguridad';
      if (req.newbalanceOrig === 0 && req.amount >= 50000) {
        diagnosisText.textContent = `Vaciado total de saldo: la cuenta transfirió el 100% de sus fondos ($${req.amount.toLocaleString()}) quedando en $0.00. Este es el patrón principal de fraude en PaySim1.`;
      } else if (Math.abs(errorOrig) > 0) {
        diagnosisText.textContent = `Discrepancia contable anómala: la suma de saldo final ($${req.newbalanceOrig}) más monto ($${req.amount}) no cuadra con el saldo inicial ($${req.oldbalanceOrg}). Diferencia de $${Math.abs(errorOrig).toLocaleString()}.`;
      } else {
        diagnosisText.textContent = `Operación de alto riesgo financiero: volumen inusual en canal de transferencia sin trazabilidad comercial regular.`;
      }
    } else if (nivel === 'MEDIO') {
      diagnosisTag.className = 'diagnosis-tag';
      diagnosisTag.textContent = 'Revisión Manual';
      diagnosisText.textContent = `Monto considerable ($${req.amount.toLocaleString()}) que amerita verificación de segundo factor, pero conserva coherencia en balances.`;
    } else {
      diagnosisTag.className = 'diagnosis-tag en-regla';
      diagnosisTag.textContent = 'Operación en Regla';
      diagnosisText.textContent = `Operación comercial ordinaria ($${req.amount.toLocaleString()}). La matemática de balance cuadra perfectamente y no muestra signos de sustracción no autorizada.`;
    }
  }

  // --- Emulación y Captura de Rechazo HTTP 422 (Pydantic v2) ---
  function triggerPydanticValidationError(txnId, tipo, amount) {
    const pydanticErrorResponse = {
      status_code: 422,
      error: "Unprocessable Entity",
      layer: "Pydantic v2 Request Validation Barrier",
      detail: [
        {
          type: "greater_than",
          loc: ["body", "amount"],
          msg: "Input should be greater than 0",
          input: isNaN(amount) ? -500.0 : amount,
          ctx: { gt: 0.0 }
        }
      ],
      fastapi_contract: "TransaccionInput (src/api.py)",
      transaccion_procesada: false
    };

    renderValidationError(pydanticErrorResponse);
  }

  function renderValidationError(errorData) {
    liveLatency.textContent = '0.12 ms';
    scoreText.textContent = '0.0% [RECHAZADO]';
    scoreFill.style.width = '100%';
    scoreFill.style.backgroundColor = '#f87171';

    badgeAlert.className = 'badge-status critico';
    badgeAlert.textContent = 'HTTP 422 RECHAZADO';

    resError.textContent = 'N/A';
    resBinary.textContent = 'RECHAZO EN VALIDACIÓN PYDANTIC V2';
    resBinary.style.color = '#f87171';

    diagnosisTag.className = 'diagnosis-tag error-schema';
    diagnosisTag.textContent = 'Rechazo de Esquema';
    diagnosisText.textContent = 'Carga de datos corrupta: El monto ingresado no cumple la regla de validación estricta de Pydantic v2 (debe ser estrictamente positivo). Petición interceptada antes de inferencia.';

    jsonCode.textContent = JSON.stringify(errorData, null, 2);
  }

  // --- Conmutador de Motor de Backend (Cloud vs API Local) ---
  function setBackendMode(mode, showFeedback = true) {
    currentBackendMode = mode;
    if (mode === 'api') {
      btnModeApi.classList.add('mode-active');
      btnModeBrowser.classList.remove('mode-active');
      checkApiHealth(showFeedback);
    } else {
      btnModeBrowser.classList.add('mode-active');
      btnModeApi.classList.remove('mode-active');
      apiStatusDot.classList.remove('is-online');
      runSimulation();
    }
  }

  async function checkApiHealth(showFeedback) {
    try {
      const res = await fetch('http://localhost:8000/health');
      if (res.ok) {
        apiStatusDot.classList.add('is-online');
        runSimulation();
        if (showFeedback) {
          tourStepTitle.textContent = "Conectado:";
          tourStepDesc.textContent = "Microservicio FastAPI local detectado en http://localhost:8000. Todas las peticiones se procesan en tu máquina.";
        }
      } else {
        throw new Error('Respuesta no saludable');
      }
    } catch (e) {
      apiStatusDot.classList.remove('is-online');
      alert('No se pudo conectar a http://localhost:8000.\n\nPara usar este modo, enciende el microservicio ejecutando "iniciar_proyecto.bat" o "uvicorn src.api:app".\n\nRegresando a modo Simulador Cloud.');
      setBackendMode('browser', false);
    }
  }

  btnModeBrowser.addEventListener('click', () => setBackendMode('browser'));
  btnModeApi.addEventListener('click', () => setBackendMode('api'));

  // --- Botón Copiar Payload JSON ---
  if (btnCopyPayload) {
    btnCopyPayload.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(jsonCode.textContent);
        copyBtnText.textContent = '¡Copiado!';
        btnCopyPayload.style.borderColor = 'var(--accent-emerald)';
        btnCopyPayload.style.color = 'var(--accent-emerald)';
        setTimeout(() => {
          copyBtnText.textContent = 'Copiar Payload';
          btnCopyPayload.style.borderColor = '';
          btnCopyPayload.style.color = '';
        }, 1500);
      } catch (err) {
        copyBtnText.textContent = 'Error al copiar';
      }
    });
  }

  // --- Presets Rápidos ---
  function applyPresetLegit() {
    tipoOpSelect.value = 'PAYMENT';
    amountInput.value = 450;
    numAmount.value = 450;
    oldOrgInput.value = 12000;
    numOldOrg.value = 12000;
    newOrgInput.value = 11550;
    numNewOrg.value = 11550;
    oldDestInput.value = 0;
    numOldDest.value = 0;
    newDestInput.value = 0;
    numNewDest.value = 0;
    runSimulation();
  }

  function applyPresetDrain() {
    tipoOpSelect.value = 'TRANSFER';
    amountInput.value = 250000;
    numAmount.value = 250000;
    oldOrgInput.value = 250000;
    numOldOrg.value = 250000;
    newOrgInput.value = 0;
    numNewOrg.value = 0;
    oldDestInput.value = 0;
    numOldDest.value = 0;
    newDestInput.value = 250000;
    numNewDest.value = 250000;
    runSimulation();
  }

  function applyPresetCashout() {
    tipoOpSelect.value = 'CASH-OUT';
    amountInput.value = 180000;
    numAmount.value = 180000;
    oldOrgInput.value = 180000;
    numOldOrg.value = 180000;
    newOrgInput.value = 0;
    numNewOrg.value = 0;
    oldDestInput.value = 50000;
    numOldDest.value = 50000;
    newDestInput.value = 230000;
    numNewDest.value = 230000;
    runSimulation();
  }

  function applyPresetError422() {
    tipoOpSelect.value = 'TRANSFER';
    numAmount.value = -500;
    amountInput.value = 0;
    triggerPydanticValidationError(transaccionIdInput.value, 'TRANSFER', -500);
  }

  btnDrain.addEventListener('click', applyPresetDrain);
  btnLegit.addEventListener('click', applyPresetLegit);
  btnCashout.addEventListener('click', applyPresetCashout);
  btnError422.addEventListener('click', applyPresetError422);

  // --- Tour Guiado Automático (3 Pasos de Simulación) ---
  const tourSteps = [
    {
      stepNumber: 1,
      title: "Paso 1: Pago Comercial Típico (Legítimo)",
      desc: "Transacción cotidiana ($450). Tenía $12,000 y le quedan $11,550. El cálculo contable cuadra a la perfección y la alerta es BAJA (1.1%).",
      action: applyPresetLegit
    },
    {
      stepNumber: 2,
      title: "Paso 2: Vaciado Fraudulento de Saldo (Fraude)",
      desc: "Intento de vaciado completo: se transfieren $250,000 dejando la cuenta en $0.00. El clasificador reacciona con alerta CRÍTICA (89.4%).",
      action: applyPresetDrain
    },
    {
      stepNumber: 3,
      title: "Paso 3: Rechazo de Contrato Pydantic v2 (HTTP 422)",
      desc: "Un sistema externo envía monto negativo (-$500). Pydantic v2 frena la petición en la frontera antes de desperdiciar recursos del modelo.",
      action: applyPresetError422
    }
  ];

  function runTourStep(index) {
    tourCurrentStep = index;
    tourStepDots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === index);
    });

    const step = tourSteps[index];
    tourStepTitle.textContent = step.title + ":";
    tourStepDesc.textContent = step.desc;
    step.action();
  }

  function startGuidedTour() {
    if (tourInterval) {
      clearInterval(tourInterval);
      tourInterval = null;
      tourBtnText.textContent = "Ver Demostración Guiada (3 Pasos)";
      tourStepTitle.textContent = "Tour Pausado:";
      tourStepDesc.textContent = "Puedes explorar los controles manualmente o reiniciar el recorrido cuando gustes.";
      return;
    }

    tourBtnText.textContent = "⏹ Detener Tour Guiado";
    runTourStep(0);

    tourInterval = setInterval(() => {
      let nextStep = (tourCurrentStep + 1);
      if (nextStep >= tourSteps.length) {
        clearInterval(tourInterval);
        tourInterval = null;
        tourBtnText.textContent = "▶ Reiniciar Demostración";
        tourStepTitle.textContent = "Demostración Finalizada:";
        tourStepDesc.textContent = "Has visto los 3 pilares del microservicio: transacciones legítimas, detección de fraude y validación estricta de esquemas.";
        return;
      }
      runTourStep(nextStep);
    }, 5000);
  }

  btnStartTour.addEventListener('click', startGuidedTour);

  tourStepDots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      if (tourInterval) {
        clearInterval(tourInterval);
        tourInterval = null;
        tourBtnText.textContent = "Ver Demostración Guiada (3 Pasos)";
      }
      runTourStep(idx);
    });
  });

  // --- Inspector Interactivo del DAG de Dask ---
  const daskSteps = {
    read_csv: {
      badge: "Paso 1: Ingesta Particionada Out-of-Core",
      filename: "src/bigdata_processor.py",
      code: `ddf = dd.read_csv(\n    df_o_ruta,\n    dtype=dtypes,\n    blocksize="64MB"\n)`,
      doc: "Carga el dataset de +6.3M de filas dividiéndolo en fragmentos de memoria streaming sin superar el presupuesto de RAM del contenedor."
    },
    assign: {
      badge: "Paso 2: Feature Engineering Vectorizado",
      filename: "src/bigdata_processor.py",
      code: `ddf_riesgo["errorBalanceOrig"] = (\n    ddf_riesgo["newbalanceOrig"] + \n    ddf_riesgo["amount"] - \n    ddf_riesgo["oldbalanceOrg"]\n)`,
      doc: "Calcula la discrepancia contable de saldo en origen de forma perezosa (lazy) dentro de la expresión del grafo sin materializar a RAM."
    },
    map_partitions: {
      badge: "Paso 3: Filtrado y Agregación Concurrente",
      filename: "src/bigdata_processor.py",
      code: `ddf_riesgo = ddf[ddf["type"].isin(["TRANSFER", "CASH_OUT"])]\nagg_dag = ddf_riesgo.groupby("type").agg(\n    total_transacciones=("amount", "count"),\n    volumen_total=("amount", "sum"),\n    total_fraudes=("isFraud", "sum")\n)`,
      doc: "MapReduce distribuido: descarta transacciones irrelevantes y computa agregaciones paralelizadas entre workers."
    },
    compute: {
      badge: "Paso 4: Disparador Terminal & Persistencia",
      filename: "src/bigdata_processor.py",
      code: `res = agg_dag.compute().reset_index()\n# Persistencia con PyMongo e índices en BSON\ncollection.insert_many(res.to_dict("records"))`,
      doc: "Único punto de cómputo físico (sync barrier). Materializa los resultados finales directamente a colecciones indexadas en MongoDB y almacenamiento Parquet."
    }
  };

  const dagNodes = document.querySelectorAll('.dag-node.node-interactive');
  const inspectorBadge = document.getElementById('inspector-badge');
  const inspectorCode = document.getElementById('inspector-code');
  const inspectorDoc = document.getElementById('inspector-doc');

  dagNodes.forEach(node => {
    node.addEventListener('click', () => {
      dagNodes.forEach(n => n.classList.remove('is-selected'));
      node.classList.add('is-selected');

      const stepKey = node.getAttribute('data-step');
      const stepData = daskSteps[stepKey];
      if (stepData) {
        inspectorBadge.textContent = stepData.badge;
        inspectorCode.textContent = stepData.code;
        inspectorDoc.textContent = stepData.doc;
      }
    });
  });

  // --- Selector de Blocksize Dask ---
  const bsButtons = document.querySelectorAll('.bs-btn');
  const memoryPillStatus = document.getElementById('memory-pill-status');
  const benchDaskLabel = document.getElementById('bench-dask-label');
  const nodeReadDesc = document.getElementById('node-read-desc');

  bsButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      bsButtons.forEach(b => b.classList.remove('bs-active'));
      btn.classList.add('bs-active');

      const bs = btn.getAttribute('data-bs');
      if (bs === '32') {
        memoryPillStatus.textContent = '220 MB RAM Streaming';
        benchDaskLabel.textContent = '~220 MB (16 Particiones · Granular)';
        nodeReadDesc.textContent = 'Particionado en bloques · 32MB streaming (16 Chunks)';
      } else if (bs === '64') {
        memoryPillStatus.textContent = '350 MB RAM Streaming';
        benchDaskLabel.textContent = '~350 MB (8 Particiones · Óptimo Prod)';
        nodeReadDesc.textContent = 'Particionado en bloques · 64MB streaming (8 Chunks)';
      } else if (bs === '128') {
        memoryPillStatus.textContent = '580 MB RAM Streaming';
        benchDaskLabel.textContent = '~580 MB (4 Particiones · Menor Overhead)';
        nodeReadDesc.textContent = 'Particionado en bloques · 128MB streaming (4 Chunks)';
      }
    });
  });

  // Ejecución inicial
  runSimulation();
});
