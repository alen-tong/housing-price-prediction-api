from __future__ import annotations

import json
import sqlite3
from datetime import UTC, datetime
from pathlib import Path

from app.schemas import EstimateRecord, HousingFeatures


class EstimateRepository:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path

    def init_db(self) -> None:
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS estimates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    label TEXT,
                    features_json TEXT NOT NULL,
                    predicted_price REAL NOT NULL,
                    model_version TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
                """
            )

    def create(
        self,
        *,
        label: str | None,
        features: HousingFeatures,
        predicted_price: float,
        model_version: str,
    ) -> EstimateRecord:
        created_at = datetime.now(UTC)
        clean_features = HousingFeatures(**features.model_dump(exclude={"label"}))
        with self._connect() as conn:
            cursor = conn.execute(
                """
                INSERT INTO estimates (label, features_json, predicted_price, model_version, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    label,
                    clean_features.model_dump_json(),
                    predicted_price,
                    model_version,
                    created_at.isoformat(),
                ),
            )
            record_id = int(cursor.lastrowid)

        return EstimateRecord(
            id=record_id,
            label=label,
            features=clean_features,
            predicted_price=predicted_price,
            model_version=model_version,
            created_at=created_at,
        )

    def list(self) -> list[EstimateRecord]:
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT id, label, features_json, predicted_price, model_version, created_at
                FROM estimates
                ORDER BY created_at DESC, id DESC
                """
            ).fetchall()
        return [self._to_record(row) for row in rows]

    def get(self, record_id: int) -> EstimateRecord | None:
        with self._connect() as conn:
            row = conn.execute(
                """
                SELECT id, label, features_json, predicted_price, model_version, created_at
                FROM estimates
                WHERE id = ?
                """,
                (record_id,),
            ).fetchone()
        return self._to_record(row) if row else None

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    @staticmethod
    def _to_record(row: sqlite3.Row) -> EstimateRecord:
        return EstimateRecord(
            id=int(row["id"]),
            label=row["label"],
            features=HousingFeatures(**json.loads(row["features_json"])),
            predicted_price=float(row["predicted_price"]),
            model_version=str(row["model_version"]),
            created_at=datetime.fromisoformat(row["created_at"]),
        )
