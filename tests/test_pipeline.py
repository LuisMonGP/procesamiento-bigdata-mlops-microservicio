"""Suite de pruebas unitarias para procesamiento-bigdata-mlops-microservicio."""

from __future__ import annotations

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from src.api import app
from src.bigdata_processor import ProcesadorTransaccionesDistribuidas
from src.data_loader import load_dataset
from src.nosql_connector import ConectorNoSQLHibrido


@pytest.fixture
def cliente() -> TestClient:
    """Fixture del cliente de pruebas de FastAPI."""
    return TestClient(app)


@pytest.fixture
def muestra_transacciones() -> pd.DataFrame:
    """Fixture de transacciones PaySim."""
    df = load_dataset(force_sample=True)
    if isinstance(df, list):
        df = pd.DataFrame(df)
    return df


def test_procesador_dask_flujo_exitoso(muestra_transacciones: pd.DataFrame) -> None:
    """Valida que el procesador Dask filtre operaciones de riesgo y calcule discrepancias."""
    procesador = ProcesadorTransaccionesDistribuidas(n_particiones=2)
    resumen = procesador.procesar_grafo_dask(muestra_transacciones)

    assert not resumen.empty
    assert "type" in resumen.columns
    assert "volumen_total" in resumen.columns
    assert "tasa_fraude" in resumen.columns
    assert (resumen["volumen_total"] > 0).all()


def test_procesador_dask_dataframe_vacio() -> None:
    """Valida que el procesador maneje DataFrames vacíos sin excepciones."""
    procesador = ProcesadorTransaccionesDistribuidas()
    df_vacio = pd.DataFrame(columns=["step", "type", "amount", "oldbalanceOrg", "newbalanceOrig"])
    res = procesador.procesar_grafo_dask(df_vacio)
    assert res.empty


def test_api_salud(cliente: TestClient) -> None:
    """Valida que GET /health retorne 200 OK y modelo_cargado true."""
    resp = cliente.get("/health")
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["estado"] == "saludable"
    assert datos["modelo_cargado"] is True


def test_api_predecir_transaccion_valida(cliente: TestClient) -> None:
    """Valida que POST /predict retorne 200 OK con cálculo de discrepancia de balance."""
    payload = {
        "transaccion_id": "TXN-998811",
        "tipo_operacion": "TRANSFER",
        "amount": 280000.0,
        "oldbalanceOrg": 280000.0,
        "newbalanceOrig": 0.0,
        "oldbalanceDest": 0.0,
        "newbalanceDest": 280000.0,
    }
    resp = cliente.post("/predict", json=payload)
    assert resp.status_code == 200
    datos = resp.json()
    assert datos["transaccion_id"] == "TXN-998811"
    assert datos["es_fraude"] in [0, 1]
    assert 0.0 <= datos["probabilidad_riesgo"] <= 1.0
    assert datos["nivel_alerta"] in ["BAJO", "MEDIO", "CRITICO"]
    assert datos["latencia_ms"] >= 0.0


def test_api_predecir_rechaza_monto_negativo(cliente: TestClient) -> None:
    """Valida que POST /predict rechace automáticamente con HTTP 422 montos <= 0."""
    payload_invalido = {
        "transaccion_id": "TXN-INVALID",
        "tipo_operacion": "TRANSFER",
        "amount": -500.0,  # Monto negativo inválido
        "oldbalanceOrg": 1000.0,
        "newbalanceOrig": 500.0,
        "oldbalanceDest": 0.0,
        "newbalanceDest": 500.0,
    }
    resp = cliente.post("/predict", json=payload_invalido)
    assert resp.status_code == 422


def test_conector_nosql_mock(muestra_transacciones: pd.DataFrame) -> None:
    """Valida que el conector NoSQL persista en mock sin requerir servidor MongoDB activo."""
    conector = ConectorNoSQLHibrido()
    procesador = ProcesadorTransaccionesDistribuidas()
    resumen = procesador.procesar_grafo_dask(muestra_transacciones)

    insertados = conector.persistir_reportes_agregados(resumen)
    assert insertados == len(resumen)

    respaldo = conector.respaldar_en_data_lake(resumen)
    assert respaldo["estado"] == "exitoso"
    assert len(respaldo["particiones_escritas"]) > 0
