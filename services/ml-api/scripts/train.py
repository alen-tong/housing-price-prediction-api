from __future__ import annotations

import json
import sys
from datetime import UTC, datetime
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, r2_score, root_mean_squared_error
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from app.config import (
    DATASET_PATH,
    FEATURE_COLUMNS,
    ID_COLUMN,
    METRICS_PATH,
    MODEL_PATH,
    TARGET_COLUMN,
)


RANDOM_STATE = 42
TEST_SIZE = 0.2


def _load_dataset(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found: {path}")

    frame = pd.read_csv(path)
    required = set(FEATURE_COLUMNS + [TARGET_COLUMN])
    missing = sorted(required - set(frame.columns))
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")

    model_columns = FEATURE_COLUMNS + [TARGET_COLUMN]
    frame = frame[model_columns].copy()
    for column in model_columns:
        frame[column] = pd.to_numeric(frame[column], errors="coerce")

    before = len(frame)
    frame = frame.dropna(subset=model_columns)
    if frame.empty:
        raise ValueError("Dataset has no valid rows after numeric conversion and null filtering")
    dropped = before - len(frame)
    if dropped:
        print(f"Dropped {dropped} rows with missing or non-numeric values")

    return frame


def _metrics(y_true: pd.Series, y_pred: pd.Series) -> dict[str, float]:
    return {
        "mae": round(float(mean_absolute_error(y_true, y_pred)), 4),
        "rmse": round(float(root_mean_squared_error(y_true, y_pred)), 4),
        "r2": round(float(r2_score(y_true, y_pred)), 6),
    }


def train() -> dict[str, object]:
    frame = _load_dataset(DATASET_PATH)
    x = frame[FEATURE_COLUMNS]
    y = frame[TARGET_COLUMN]
    training_timestamp = datetime.now(UTC).isoformat()

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
    )

    preprocessor = ColumnTransformer(
        transformers=[("numeric", StandardScaler(), FEATURE_COLUMNS)],
        remainder="drop",
        verbose_feature_names_out=False,
    )
    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("regressor", Ridge(alpha=1.0)),
        ]
    )
    pipeline.fit(x_train, y_train)

    transformed_feature_names = [
        str(name) for name in pipeline[:-1].get_feature_names_out()
    ]
    regressor = pipeline.named_steps["regressor"]
    coefficients = [
        {"feature": name, "coefficient": round(float(coef), 6)}
        for name, coef in zip(transformed_feature_names, regressor.coef_, strict=True)
    ]

    metrics = {
        "model_type": "Ridge",
        "target_column": TARGET_COLUMN,
        "feature_columns": FEATURE_COLUMNS,
        "transformed_feature_names": transformed_feature_names,
        "coefficient_scale": "standardized_numeric_features",
        "coefficients": coefficients,
        "intercept": round(float(regressor.intercept_), 6),
        "metrics": {
            "train": _metrics(y_train, pipeline.predict(x_train)),
            "test": _metrics(y_test, pipeline.predict(x_test)),
        },
        "row_counts": {
            "total": int(len(frame)),
            "train": int(len(x_train)),
            "test": int(len(x_test)),
        },
        "training_timestamp": training_timestamp,
        "model_version": training_timestamp,
        "dataset": {
            "path": str(DATASET_PATH),
            "rows": int(len(frame)),
            "columns": [column for column in frame.columns if column != ID_COLUMN],
        },
    }

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    METRICS_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    METRICS_PATH.write_text(json.dumps(metrics, indent=2))
    return metrics


if __name__ == "__main__":
    result = train()
    print(
        "Trained {model_type} on {train} rows; test RMSE={rmse}".format(
            model_type=result["model_type"],
            train=result["row_counts"]["train"],  # type: ignore[index]
            rmse=result["metrics"]["test"]["rmse"],  # type: ignore[index]
        )
    )
