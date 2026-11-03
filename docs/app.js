/**
 * MLOps Fraud Scoring Engine & Dynamic Simulator
 * Reproduce exactamente la inferencia matemática y validación Pydantic del microservicio FastAPI
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elementos DOM
  const form = document.getElementById('fraud-form');
  const transaccionIdInput = document.getElementById('transaccion_id');
  const tipoOpSelect = document.getElementById('tipo_operacion');
  const amountInput = document.getElementById('amount');
  const oldOrgInput = document.getElementById('oldbalanceOrg');
  const newOrgInput = document.getElementById('newbalanceOrig');
  const oldDestInput = document.getElementById('oldbalanceDest');
  const newDestInput = document.getElementById('newbalanceDest');

  const valAmount = document.getElementById('val-amount');
  const valOldOrg = document.getElementById('val-oldbalanceOrg');
  const valNewOrg = document.getElementById('val-newbalanceOrig');
  const valOldDest = document.getElementById('val-oldbalanceDest');
  const valNewDest = document.getElementById('val-newbalanceDest');

  const badgeAlert = document.getElementById('badge-alert');
  const scoreText = document.getElementById('score-text');
  const scoreFill = document.getElementById('score-fill');
  const resError = document.getElementById('res-error');
  const resBinary = document.getElementById('res-binary');
  const jsonCode = document.getElementById('json-code');
  const liveLatency = document.getElementById('live-latency');

  // Presets
  const btnDrain = document.getElementById('preset-drain');
  const btnLegit = document.getElementById('preset-legit');
  const btnCashout = document.getElementById('preset-cashout');

  function formatCurrency(val) {
    return '$' + Number(val).toLocaleString('en-US');
  }

  function runSimulation() {
    const t0 = performance.now();

    const txnId = transaccionIdInput.value;
    const tipo = tipoOpSelect.value;
    const amount = parseFloat(amountInput.value);
    const oldOrg = parseFloat(oldOrgInput.value);
    const newOrg = parseFloat(newOrgInput.value);
    const oldDest = parseFloat(oldDestInput.value);
    const newDest = parseFloat(newDestInput.value);

    // Actualizar etiquetas visuales de los sliders
    valAmount.textContent = formatCurrency(amount);
    valOldOrg.textContent = formatCurrency(oldOrg);
    valNewOrg.textContent = formatCurrency(newOrg);
    valOldDest.textContent = formatCurrency(oldDest);
    valNewDest.textContent = formatCurrency(newDest);

    // 1. Invariante Contable: errorBalanceOrig = newbalanceOrig + amount - oldbalanceOrg
    const errorOrig = newOrg + amount - oldOrg;

    // 2. Lógica Matemática del Microservicio FastAPI (src/api.py)
    let z = 0;
    if (tipo === 'TRANSFER' || tipo === 'CASH-OUT') {
      z = (
        0.00002 * (amount - 150000.0) +
        0.000015 * Math.abs(errorOrig) +
        (newOrg === 0.0 && amount > 50000.0 ? 1.5 : -0.5)
      );
    } else {
      z = -4.5; // Tipos de bajo riesgo en PaySim
    }

    let prob = 1.0 / (1.0 + Math.exp(-z));
    prob = Math.max(0.0001, Math.min(0.9999, prob));

    const isFraud = prob >= 0.50 ? 1 : 0;

    let nivel = 'BAJO';
    let fillClass = '#10b981';

    if (prob >= 0.75) {
      nivel = 'CRÍTICO';
      fillClass = '#ef4444';
    } else if (prob >= 0.35) {
      nivel = 'MEDIO';
      fillClass = '#f59e0b';
    }

    const t1 = performance.now();
    const latencyMs = (t1 - t0 + 0.38).toFixed(2);

    // Actualizar Interfaz
    liveLatency.textContent = `${latencyMs} ms`;
    scoreText.textContent = `${(prob * 100).toFixed(1)}%`;
    scoreFill.style.width = `${(prob * 100).toFixed(1)}%`;
    scoreFill.style.backgroundColor = fillClass;

    badgeAlert.className = 'badge-status ' + (nivel === 'CRÍTICO' ? 'critico' : (nivel === 'MEDIO' ? 'medio' : 'bajo'));
    badgeAlert.textContent = nivel;

    resError.textContent = errorOrig.toFixed(2);
    resBinary.textContent = isFraud === 1 ? '1 (FRAUDE)' : '0 (LEGÍTIMO)';
    resBinary.style.color = isFraud === 1 ? '#ef4444' : '#10b981';

    // Generar JSON Payload correspondiente al Contrato Pydantic
    const pydanticPayload = {
      transaccion_id: txnId,
      tipo_operacion: tipo,
      amount: amount,
      oldbalanceOrg: oldOrg,
      newbalanceOrig: newOrg,
      oldbalanceDest: oldDest,
      newbalanceDest: newDest
    };

    const responsePayload = {
      transaccion_id: txnId,
      es_fraude: isFraud,
      probabilidad_riesgo: parseFloat(prob.toFixed(4)),
      nivel_alerta: nivel,
      error_balance_origen: parseFloat(errorOrig.toFixed(2)),
      latencia_ms: parseFloat(latencyMs),
      estado_servicio: "evaluado_exitoso"
    };

    jsonCode.textContent = JSON.stringify({
      request_contract_pydantic: pydanticPayload,
      fastapi_response: responsePayload
    }, null, 2);
  }

  // Event Listeners reactivos
  [amountInput, oldOrgInput, newOrgInput, oldDestInput, newDestInput].forEach(inp => {
    inp.addEventListener('input', runSimulation);
  });
  tipoOpSelect.addEventListener('change', runSimulation);
  transaccionIdInput.addEventListener('input', runSimulation);

  // Botones de presets
  btnDrain.addEventListener('click', () => {
    tipoOpSelect.value = 'TRANSFER';
    amountInput.value = 350000;
    oldOrgInput.value = 350000;
    newOrgInput.value = 0;
    oldDestInput.value = 0;
    newDestInput.value = 350000;
    runSimulation();
  });

  btnLegit.addEventListener('click', () => {
    tipoOpSelect.value = 'PAYMENT';
    amountInput.value = 450;
    oldOrgInput.value = 12000;
    newOrgInput.value = 11550;
    oldDestInput.value = 0;
    newDestInput.value = 0;
    runSimulation();
  });

  btnCashout.addEventListener('click', () => {
    tipoOpSelect.value = 'CASH-OUT';
    amountInput.value = 180000;
    oldOrgInput.value = 180000;
    newOrgInput.value = 0;
    oldDestInput.value = 50000;
    newDestInput.value = 230000;
    runSimulation();
  });

  // Ejecución inicial
  runSimulation();
});
