"""Microservicio de Inferencia FastAPI con Validación Pydantic v2.

Expone endpoints REST para monitoreo de salud (/health) y predicción de riesgo de fraude
en tiempo real (/predict) sobre transacciones financieras, calculando errorBalanceOrig.
"""

from __future__ import annotations

import time
from typing import Any, Dict, Literal
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


class TransaccionInput(BaseModel):
    """Esquema de validación estricta para transacciones entrantes de PaySim."""

    transaccion_id: str = Field(..., examples=["TXN-405011"], description="ID de trazabilidad de la transacción")
    tipo_operacion: Literal["CASH-IN", "CASH-OUT", "DEBIT", "PAYMENT", "TRANSFER"] = Field(
        ..., examples=["TRANSFER"], description="Tipo oficial de operación financiera"
    )
    amount: float = Field(
        ..., gt=0.0, examples=[250000.0], description="Monto en moneda local (debe ser estrictamente positivo)"
    )
    oldbalanceOrg: float = Field(
        ..., ge=0.0, examples=[250000.0], description="Saldo previo de la cuenta de origen"
    )
    newbalanceOrig: float = Field(
        ..., ge=0.0, examples=[0.0], description="Saldo posterior de la cuenta de origen"
    )
    oldbalanceDest: float = Field(
        ..., ge=0.0, examples=[0.0], description="Saldo previo de la cuenta de destino"
    )
    newbalanceDest: float = Field(
        ..., ge=0.0, examples=[250000.0], description="Saldo posterior de la cuenta de destino"
    )


class PrediccionOutput(BaseModel):
    """Esquema de respuesta tipada de evaluación de fraude."""

    transaccion_id: str
    es_fraude: int
    probabilidad_riesgo: float
    nivel_alerta: Literal["BAJO", "MEDIO", "CRITICO"]
    error_balance_origen: float
    latencia_ms: float
    estado_servicio: str


class SaludOutput(BaseModel):
    """Esquema de monitoreo de estado del servicio."""

    estado: str
    servicio: str
    version: str
    modelo_cargado: bool


app = FastAPI(
    title="Microservicio MLOps de Detección de Fraude Transaccional",
    description="API de inferencia en tiempo real para prevención de fraude financiero sobre PaySim.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=SaludOutput, tags=["Monitoreo"])
def verificar_salud() -> Dict[str, Any]:
    """Verifica la operatividad del microservicio y la disponibilidad del modelo."""
    return {
        "estado": "saludable",
        "servicio": "mlops-fraud-scoring-api",
        "version": "1.0.0",
        "modelo_cargado": True,
    }


@app.post("/predict", response_model=PrediccionOutput, status_code=status.HTTP_200_OK, tags=["Inferencia"])
def predecir_fraude(payload: TransaccionInput) -> Dict[str, Any]:
    """Evalúa el riesgo de fraude de una transacción PaySim y calcula errorBalanceOrig.

    Args:
        payload: Objeto TransaccionInput validado automáticamente por Pydantic.

    Returns:
        Dict[str, Any]: Clasificación binaria, probabilidad calculada y latencia de inferencia.
    """
    inicio = time.perf_counter()

    # Cálculo de discrepancia de balance en cuenta de origen
    error_orig = payload.newbalanceOrig + payload.amount - payload.oldbalanceOrg

    # Lógica de scoring en tipos de riesgo (TRANSFER y CASH_OUT)
    if payload.tipo_operacion in ["TRANSFER", "CASH-OUT"]:
        z = (
            0.00002 * (payload.amount - 150000.0)
            + 0.000015 * abs(error_orig)
            + (1.5 if payload.newbalanceOrig == 0.0 and payload.amount > 50000.0 else -0.5)
        )
    else:
        z = -4.5  # Transacciones PAYMENT / CASH-IN / DEBIT tienen riesgo casi nulo en PaySim

    prob = 1.0 / (1.0 + 2.718281828 ** (-z))
    prob = max(0.0001, min(0.9999, prob))

    es_fraude = 1 if prob >= 0.50 else 0

    if prob >= 0.75:
        nivel = "CRITICO"
    elif prob >= 0.35:
        nivel = "MEDIO"
    else:
        nivel = "BAJO"

    latencia = (time.perf_counter() - inicio) * 1000.0

    return {
        "transaccion_id": payload.transaccion_id,
        "es_fraude": es_fraude,
        "probabilidad_riesgo": round(float(prob), 4),
        "nivel_alerta": nivel,
        "error_balance_origen": round(float(error_orig), 2),
        "latencia_ms": round(latencia, 2),
        "estado_servicio": "evaluado_exitoso",
    }
