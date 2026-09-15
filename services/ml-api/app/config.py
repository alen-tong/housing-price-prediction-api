from pathlib import Path
import os


ROOT_DIR = Path(__file__).resolve().parent.parent

APP_NAME = "Housing Price Prediction API"
APP_VERSION = "0.1.0"

DATASET_PATH = Path(os.getenv("DATASET_PATH", ROOT_DIR / "data" / "housing.csv"))
MODEL_PATH = Path(os.getenv("MODEL_PATH", ROOT_DIR / "models" / "model.joblib"))
METRICS_PATH = Path(os.getenv("METRICS_PATH", ROOT_DIR / "models" / "metrics.json"))

TARGET_COLUMN = "price"
ID_COLUMN = "id"
FEATURE_COLUMNS = [
    "square_footage",
    "bedrooms",
    "bathrooms",
    "year_built",
    "lot_size",
    "distance_to_city_center",
    "school_rating",
]
