"""Procesamiento Distribuido Out-of-Core con Dask & Arquitectura PySpark.

Implementa grafos de tareas con evaluación perezosa (Lazy Evaluation), filtrado
de operaciones de riesgo (TRANSFER y CASH_OUT) y cálculo de discrepancias de balance.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
import pandas as pd


class ProcesadorTransaccionesDistribuidas:
    """Procesador distribuido de transacciones financieras mediante Dask DataFrame."""

    def __init__(self, n_particiones: int = 4) -> None:
        """Inicializa el motor distribuido.

        Args:
            n_particiones: Cantidad de particiones del grafo computacional.
        """
        self.n_particiones = n_particiones

    def procesar_grafo_dask(self, df_o_ruta: Any) -> pd.DataFrame:
        """Construye y ejecuta el grafo perezoso de Dask sobre transacciones PaySim.

        Aplica filtrado de tipos de alto riesgo ('TRANSFER', 'CASH_OUT'), calcula
        la discrepancia 'errorBalanceOrig' y ejecuta .compute() exclusivamente al final.

        Args:
            df_o_ruta: Ruta de archivo CSV o DataFrame de Pandas.

        Returns:
            pd.DataFrame: Resumen agregado calculado tras .compute().
        """
        try:
            import dask.dataframe as dd

            dtypes = {
                "step": "int16",
                "type": "category",
                "amount": "float32",
                "oldbalanceOrg": "float32",
                "newbalanceOrig": "float32",
                "oldbalanceDest": "float32",
                "newbalanceDest": "float32",
                "isFraud": "int8",
                "isFlaggedFraud": "int8",
            }

            if isinstance(df_o_ruta, str):
                ddf = dd.read_csv(df_o_ruta, dtype=dtypes, blocksize="64MB")
            else:
                ddf = dd.from_pandas(df_o_ruta, npartitions=self.n_particiones)

            # 1. Filtrado perezoso: el fraude en PaySim solo ocurre en TRANSFER y CASH_OUT
            ddf_riesgo = ddf[ddf["type"].isin(["TRANSFER", "CASH_OUT"])]

            # 2. Ingeniería de variable derivada: discrepancia de balance en origen
            ddf_riesgo["errorBalanceOrig"] = ddf_riesgo["newbalanceOrig"] + ddf_riesgo["amount"] - ddf_riesgo["oldbalanceOrg"]

            # 3. Agregación perezosa por tipo de operación
            agg_dag = ddf_riesgo.groupby("type").agg(
                total_transacciones=("amount", "count"),
                volumen_total=("amount", "sum"),
                monto_promedio=("amount", "mean"),
                total_fraudes=("isFraud", "sum"),
                discrepancia_media=("errorBalanceOrig", "mean"),
            )

            # 4. Barrera de ejecución terminal
            res = agg_dag.compute().reset_index()
            res["tasa_fraude"] = (res["total_fraudes"] / res["total_transacciones"]).round(4)
            res["monto_promedio"] = res["monto_promedio"].round(2)
            res["volumen_total"] = res["volumen_total"].round(2)
            return res

        except Exception:
            # Fallback en memoria si Dask no está compilado
            pdf = pd.read_csv(df_o_ruta) if isinstance(df_o_ruta, str) else df_o_ruta.copy()
            if pdf.empty:
                return pd.DataFrame()

            pdf_riesgo = pdf[pdf["type"].isin(["TRANSFER", "CASH_OUT"])].copy()
            if pdf_riesgo.empty:
                return pd.DataFrame()

            pdf_riesgo["errorBalanceOrig"] = pdf_riesgo["newbalanceOrig"] + pdf_riesgo["amount"] - pdf_riesgo["oldbalanceOrg"]
            res = (
                pdf_riesgo.groupby("type")
                .agg(
                    total_transacciones=("amount", "count"),
                    volumen_total=("amount", "sum"),
                    monto_promedio=("amount", "mean"),
                    total_fraudes=("isFraud", "sum"),
                    discrepancia_media=("errorBalanceOrig", "mean"),
                )
                .reset_index()
            )
            res["tasa_fraude"] = (res["total_fraudes"] / res["total_transacciones"]).round(4)
            res["monto_promedio"] = res["monto_promedio"].round(2)
            res["volumen_total"] = res["volumen_total"].round(2)
            return res


def obtener_especificacion_pyspark() -> Dict[str, str]:
    """Retorna la especificación de arquitectura distribuida para PySpark Structured Streaming.

    Returns:
        Dict[str, str]: Mapeo de componentes y operaciones de streaming.
    """
    return {
        "motor": "PySpark 3.5.0 Structured Streaming",
        "ingesta": "spark.readStream.schema(schema_paysim).csv('data/raw/')",
        "transformacion": "df.filter(col('type').isin(['TRANSFER', 'CASH_OUT'])).withColumn('errorBalanceOrig', ...)",
        "sumidero_sink": "writeStream.format('mongodb').option('collection', 'alertas_fraude').start()",
        "data_lake_backup": "writeStream.format('parquet').partitionBy('type').option('path', 's3a://data-lake-paysim/')",
    }
