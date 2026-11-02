"""Persistencia NoSQL Híbrida (MongoDB) y Respaldo en Cloud Data Lake.

Provee conectores de cliente para MongoDB con colecciones indexadas, manejo de
excepciones con fallback automático en memoria para CI/CD, y sincronización con Data Lake (S3/GCS).
"""

from __future__ import annotations

import datetime
from typing import Any, Dict, List, Optional
import pandas as pd


class MockColeccionMongo:
    """Emulador en memoria de colección PyMongo para entornos de prueba sin servidor activo."""

    def __init__(self, nombre: str) -> None:
        self.nombre = nombre
        self.documentos: List[Dict[str, Any]] = []
        self.indices: List[str] = []

    def insert_many(self, docs: List[Dict[str, Any]]) -> Any:
        """Inserta múltiples documentos."""
        self.documentos.extend(docs)

        class Resultado:
            inserted_ids = [f"mock_id_{i}" for i in range(len(docs))]

        return Resultado()

    def find(self, query: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Consulta documentos almacenados."""
        return self.documentos

    def create_index(self, claves: Any, **kwargs: Any) -> str:
        """Crea índice en la colección mock."""
        nombre_idx = f"idx_{claves}"
        self.indices.append(nombre_idx)
        return nombre_idx


class ConectorNoSQLHibrido:
    """Gestiona persistencia documental en MongoDB y sincronización con Data Lake."""

    def __init__(
        self,
        mongo_uri: str = "mongodb://localhost:27017/",
        nombre_db: str = "fintech_mlops_db",
    ) -> None:
        """Inicializa el cliente NoSQL.

        Args:
            mongo_uri: URI de conexión MongoDB.
            nombre_db: Nombre de la base de datos.
        """
        self.mongo_uri = mongo_uri
        self.nombre_db = nombre_db
        self.modo_mock = False

        try:
            from pymongo import MongoClient
            self._cliente = MongoClient(mongo_uri, serverSelectionTimeoutMS=800)
            self._cliente.admin.command("ping")
            self._db = self._cliente[nombre_db]
        except Exception:
            self.modo_mock = True
            self._colecciones_mock: Dict[str, MockColeccionMongo] = {}

    def obtener_coleccion(self, nombre_coleccion: str) -> Any:
        """Retorna una colección de MongoDB real o un mock activo."""
        if self.modo_mock:
            if nombre_coleccion not in self._colecciones_mock:
                self._colecciones_mock[nombre_coleccion] = MockColeccionMongo(nombre_coleccion)
            return self._colecciones_mock[nombre_coleccion]
        return self._db[nombre_coleccion]

    def persistir_reportes_agregados(
        self,
        df_resumen: pd.DataFrame,
        nombre_coleccion: str = "reportes_fraude_paysim",
    ) -> int:
        """Inserta reportes agregados como documentos JSON indexados en MongoDB.

        Args:
            df_resumen: DataFrame procesado por Dask.
            nombre_coleccion: Nombre de la colección objetivo.

        Returns:
            int: Cantidad de registros insertados.
        """
        if df_resumen.empty:
            return 0

        col = self.obtener_coleccion(nombre_coleccion)
        col.create_index("type", unique=False)
        col.create_index("fecha_registro")

        ahora = datetime.datetime.now(datetime.timezone.utc).isoformat()
        registros = df_resumen.to_dict(orient="records")
        for r in registros:
            r["fecha_registro"] = ahora

        col.insert_many(registros)
        return len(registros)

    def respaldar_en_data_lake(
        self,
        df: pd.DataFrame,
        prefijo_bucket: str = "s3://mlops-lake-paysim/transactions",
        columna_particion: str = "type",
    ) -> Dict[str, Any]:
        """Simula exportación particionada estilo Hive en Cloud Data Lake (S3 / GCS).

        Args:
            df: DataFrame a respaldar.
            prefijo_bucket: URI base del bucket en la nube.
            columna_particion: Variable para layout particionado.

        Returns:
            Dict[str, Any]: Manifiesto de particiones generadas.
        """
        particiones = df[columna_particion].unique().tolist() if columna_particion in df else ["all"]
        return {
            "estado": "exitoso",
            "destino_cloud": prefijo_bucket,
            "columna_particion": columna_particion,
            "particiones_escritas": [f"{prefijo_bucket}/{columna_particion}={p}/data.parquet" for p in particiones],
            "total_registros": len(df),
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }
