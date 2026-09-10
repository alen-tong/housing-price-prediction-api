from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
import pandas as pd

from app.config import FEATURE_COLUMNS, METRICS_PATH, MODEL_PATH
from app.schemas import HousingFeatures


class ModelNotReadyError(RuntimeError):
    """Raised when inference is requested before the model is available."""


class ModelService:
    def __init__(
        self,
        model_path: Path = MODEL_PATH,
        metrics_path: Path = METRICS_PATH,
    ) -> None:
        self.model_path = model_path
        self.metrics_path = metrics_path
        self.pipeline: Any | None = None
        self.metrics: dict[str, Any] | None = None
        self.load_error: str | None = None

    @property
    def is_ready(self) -> bool:
        return self.pipeline is not None and self.metrics is not None

    @property
    def model_version(self) -> str:
        if not self.metrics:
            return "unavailable"
        return str(self.metrics.get("training_timestamp", "unavailable"))

    def load(self) -> None:
        try:
            if not self.model_path.exists():
                raise FileNotFoundError(f"Model artifact not found: {self.model_path}")
            if not self.metrics_path.exists():
                raise FileNotFoundError(f"Metrics file not found: {self.metrics_path}")

            self.pipeline = joblib.load(self.model_path)
            self.metrics = json.loads(self.metrics_path.read_text())
            self.load_error = None
        except Exception as exc:  # pragma: no cover - covered via health behavior
            self.pipeline = None
            self.metrics = None
            self.load_error = str(exc)
            raise

    def predict(self, items: list[HousingFeatures]) -> list[float]:
        if not self.is_ready:
            raise ModelNotReadyError(self.load_error or "Model is not loaded")
        if not items:
            raise ValueError("Prediction batch must contain at least one item")

        frame = pd.DataFrame([item.as_model_input() for item in items], columns=FEATURE_COLUMNS)
        predictions = self.pipeline.predict(frame)  # type: ignore[union-attr]
        return [round(float(value), 2) for value in predictions]

    def get_model_info(self) -> dict[str, Any]:
        if not self.is_ready:
            raise ModelNotReadyError(self.load_error or "Model is not loaded")
        return dict(self.metrics or {})
