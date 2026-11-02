"""Cargador de datos e ingesta adaptativa para transacciones financieras masivas (PaySim).

Implementa el patrón de adaptador profesional: intenta leer desde data/raw/transactions_raw.csv;
si no existe, utiliza la muestra representativa de data/sample/sample_data.csv.
"""

from __future__ import annotations

import csv
from pathlib import Path
import random
from typing import Any, List, Optional

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False


BASE_DIR = Path(__file__).resolve().parent.parent
RAW_PATH = BASE_DIR / "data" / "raw" / "transactions_raw.csv"
SAMPLE_PATH = BASE_DIR / "data" / "sample" / "sample_data.csv"


def generar_muestra_paysim(destino: Path, total: int = 500, semilla: int = 42) -> None:
    """Genera una muestra representativa con el esquema oficial de PaySim1 (Kaggle)."""
    rng = random.Random(semilla)
    tipos = ["PAYMENT", "TRANSFER", "CASH_OUT", "DEBIT", "CASH_IN"]
    filas = []

    for i in range(total):
        step = rng.randint(1, 744)
        op_type = rng.choice(tipos)
        amount = round(max(5.0, min(850000.0, rng.expovariate(1.0 / 25000.0) + 10.0)), 2)

        old_org = round(max(amount, rng.expovariate(1.0 / 40000.0)), 2)
        new_org = round(max(0.0, old_org - amount if op_type in ["TRANSFER", "CASH_OUT", "PAYMENT"] else old_org + amount), 2)

        old_dest = round(rng.expovariate(1.0 / 30000.0), 2)
        new_dest = round(old_dest + amount if op_type in ["TRANSFER", "CASH_OUT", "CASH_IN"] else old_dest, 2)

        # Regla de fraude oficial de PaySim: solo ocurre en TRANSFER y CASH_OUT
        is_fraud = 0
        if op_type in ["TRANSFER", "CASH_OUT"] and (amount > 180000.0 or (new_org == 0.0 and amount > 50000.0)):
            is_fraud = 1 if rng.random() < 0.65 else 0

        is_flagged = 1 if (is_fraud == 1 and amount > 200000.0) else 0

        filas.append({
            "step": step,
            "type": op_type,
            "amount": amount,
            "nameOrig": f"C{rng.randint(1000000, 9999999)}",
            "oldbalanceOrg": old_org,
            "newbalanceOrig": new_org,
            "nameDest": f"M{rng.randint(1000000, 9999999)}" if op_type == "PAYMENT" else f"C{rng.randint(1000000, 9999999)}",
            "oldbalanceDest": old_dest,
            "newbalanceDest": new_dest,
            "isFraud": is_fraud,
            "isFlaggedFraud": is_flagged,
        })

    destino.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = ["step", "type", "amount", "nameOrig", "oldbalanceOrg", "newbalanceOrig", "nameDest", "oldbalanceDest", "newbalanceDest", "isFraud", "isFlaggedFraud"]
    with open(destino, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(filas)


def load_dataset(force_sample: bool = False, nrows: Optional[int] = None) -> Any:
    """Carga adaptativamente el dataset masivo de transacciones o la muestra reproducible.

    Args:
        force_sample: Si es True, fuerza la carga de data/sample/sample_data.csv.
        nrows: Límite opcional de filas.

    Returns:
        pd.DataFrame | List[dict]: Transacciones cargadas.
    """
    target_path = None
    if not force_sample and RAW_PATH.exists():
        target_path = RAW_PATH
        print(f"[INFO] Cargando transacciones masivas desde: {RAW_PATH}")
    else:
        if not SAMPLE_PATH.exists():
            generar_muestra_paysim(SAMPLE_PATH, total=500)
        target_path = SAMPLE_PATH
        print(f"[INFO] Cargando muestra representativa reproducible desde: {SAMPLE_PATH}")

    if HAS_PANDAS:
        return pd.read_csv(target_path, nrows=nrows)

    with open(target_path, mode="r", encoding="utf-8") as f:
        reader = list(csv.DictReader(f))
        return reader[:nrows] if nrows else reader


if __name__ == "__main__":
    df = load_dataset()
    if HAS_PANDAS:
        print(f"Total transacciones: {len(df)}")
        print(f"Distribución por tipo:\n{df['type'].value_counts()}")
        print(f"Fraudes detectados: {df['isFraud'].sum()}")
    else:
        print(f"Total filas: {len(df)}")
