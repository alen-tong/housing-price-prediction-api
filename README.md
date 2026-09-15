# Housing Price Prediction API

A compact FastAPI service that trains a Scikit-learn regression model and serves housing price predictions through Swagger/OpenAPI.

## What It Shows

- Reproducible model training from the provided housing dataset.
- A Dockerized FastAPI API with `health`, `predict`, and `model-info` endpoints.
- Single-property and batch predictions through the same `/predict` endpoint.
- Model metrics and coefficients exposed for interview discussion.

For the system design and data flow, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Dataset

The original Excel assignment file contains two sheets:

- `Test Data For Prediction` -> converted to `data/housing.csv` and used for training/evaluation because it contains `price`.
- `House Price Dataset` -> converted to `data/prediction_examples.csv` and used as demo inputs because it contains features without `price`.

Training features:

- `square_footage`
- `bedrooms`
- `bathrooms`
- `year_built`
- `lot_size`
- `distance_to_city_center`
- `school_rating`

Target:

- `price`

## Local Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1 VECLIB_MAXIMUM_THREADS=1 MKL_NUM_THREADS=1 python scripts/train.py
OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1 VECLIB_MAXIMUM_THREADS=1 MKL_NUM_THREADS=1 uvicorn app.main:app --reload
```

Open the interactive API docs:

```text
http://localhost:8000/docs
```

## Docker Demo

```bash
docker build -t housing-price-api .
docker run --rm -p 8000:8000 housing-price-api
```

Then open:

```text
http://localhost:8000/docs
```

The Docker build runs `python scripts/train.py`, so the container starts with a ready model artifact instead of training on the first request.

## API Endpoints

### GET `/health`

Returns service status and whether the model artifact was loaded.

### POST `/predict`

Single-property request:

```json
{
  "square_footage": 1550,
  "bedrooms": 3,
  "bathrooms": 2,
  "year_built": 1997,
  "lot_size": 6800,
  "distance_to_city_center": 4.1,
  "school_rating": 7.6
}
```

Batch request:

```json
{
  "items": [
    {
      "square_footage": 1550,
      "bedrooms": 3,
      "bathrooms": 2,
      "year_built": 1997,
      "lot_size": 6800,
      "distance_to_city_center": 4.1,
      "school_rating": 7.6
    },
    {
      "square_footage": 2200,
      "bedrooms": 4,
      "bathrooms": 2.5,
      "year_built": 2008,
      "lot_size": 9600,
      "distance_to_city_center": 7,
      "school_rating": 8.8
    }
  ]
}
```

Response:

```json
{
  "predictions": [245100.32, 385922.14],
  "count": 2,
  "model_version": "2026-09-08T10:15:00Z"
}
```

### GET `/model-info`

Returns:

- model type
- original feature columns
- transformed feature names
- coefficients aligned to transformed features
- coefficient scale
- train/test metrics
- row counts
- training timestamp

The coefficients are reported on standardized numeric features, so each coefficient represents price change per one standard deviation of that feature.

## Tests

```bash
pytest
```

If local scientific Python imports are slow on macOS, run tests with single-threaded numerical libraries:

```bash
OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1 VECLIB_MAXIMUM_THREADS=1 MKL_NUM_THREADS=1 pytest
```

The tests cover:

- health check
- model info
- coefficient alignment
- single prediction
- batch prediction
- empty batch validation
- missing-field validation
