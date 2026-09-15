from pathlib import Path
import os


APP_NAME = "Property Value Estimator API"
APP_VERSION = "0.1.0"

ROOT_DIR = Path(__file__).resolve().parent.parent
ML_API_URL = os.getenv("ML_API_URL", "http://127.0.0.1:8000").rstrip("/")
DB_PATH = Path(os.getenv("ESTIMATOR_DB_PATH", ROOT_DIR / "data" / "estimates.sqlite3"))

FEATURE_COLUMNS = [
    "square_footage",
    "bedrooms",
    "bathrooms",
    "year_built",
    "lot_size",
    "distance_to_city_center",
    "school_rating",
]
