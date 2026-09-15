# Architecture

This project turns a housing price regression model into a small, deployable API service. The focus is not only model training, but also making the model easy to validate, serve, and demonstrate through a stable HTTP contract.

## System Overview

```text
Excel Dataset
    |
    v
data/housing.csv
    |
    v
scripts/train.py
    |
    +--> models/model.joblib
    |
    +--> models/metrics.json
              |
              v
FastAPI Application
    |
    +--> GET /health
    +--> POST /predict
    +--> GET /model-info
```

## Main Components

### Dataset Layer

The original assignment dataset was provided as an Excel file. It was converted into CSV files for repeatable training and demo usage:

- `data/housing.csv` contains labeled data with the `price` target column.
- `data/prediction_examples.csv` contains feature-only examples for prediction demos.

The model does not use the `id` column as a feature. The training features are:

- `square_footage`
- `bedrooms`
- `bathrooms`
- `year_built`
- `lot_size`
- `distance_to_city_center`
- `school_rating`

The prediction target is:

- `price`

### Training Pipeline

Training is handled by `scripts/train.py`.

The pipeline:

1. Loads `data/housing.csv`.
2. Validates that all required feature columns and the target column exist.
3. Converts feature and target values to numeric values.
4. Splits the data into train and test sets with a fixed random seed.
5. Applies `StandardScaler` to numeric features.
6. Trains a `Ridge` regression model.
7. Saves the full Scikit-learn pipeline to `models/model.joblib`.
8. Saves model metadata, coefficients, row counts, and metrics to `models/metrics.json`.

The full preprocessing and model pipeline is persisted together, so inference uses the same feature transformation as training.

## Inference Flow

Prediction is exposed through `POST /predict`.

The endpoint supports two request shapes.

Single property:

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

Batch prediction:

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
    }
  ]
}
```

Internally, both request shapes are normalized into a list of `HousingFeatures`. This keeps single and batch prediction on the same code path.

## API Layer

The FastAPI application is defined in `app/main.py`.

It exposes the assignment-required endpoints:

- `GET /health` checks whether the API is running and the model artifact is loaded.
- `POST /predict` returns one or more housing price predictions.
- `GET /model-info` returns model type, feature names, coefficients, train/test metrics, row counts, and model version.

Input and output contracts are defined in `app/schemas.py` using Pydantic. Invalid payloads return structured validation errors before they reach the model.

## Model Service

`app/model.py` contains the `ModelService`.

Its responsibilities are:

- load `models/model.joblib`
- load `models/metrics.json`
- expose model readiness
- convert validated API input into a Pandas DataFrame
- call the Scikit-learn pipeline for prediction
- return rounded prediction values

This separates API routing from model-loading and prediction logic.

## Model Info and Coefficients

The `/model-info` endpoint returns coefficients aligned with transformed feature names.

Because the model uses `StandardScaler`, coefficients are reported on standardized numeric features. That means each coefficient represents the price impact of a one-standard-deviation change in that feature, not a one-unit raw change.

The service records both training and test metrics:

- MAE
- RMSE
- R2

The test metrics are the main performance reference for discussion.

## Docker Deployment

The Dockerfile uses `python:3.12-slim`, which matches the assignment requirement.

The image build process:

1. Installs pinned dependencies from `requirements.txt`.
2. Copies the app, training script, and data files.
3. Runs `python scripts/train.py` during image build.
4. Starts Uvicorn and serves the FastAPI app on port `8000`.

The model is trained during image build, so the first API request does not pay a training cost.

## Error Handling

The service handles common failure cases:

- Missing or invalid request fields return FastAPI/Pydantic validation errors.
- Empty batch requests return HTTP `400`.
- Missing or unloadable model artifacts return HTTP `503` for prediction and model-info requests.
- `/health` exposes degraded model-loading state instead of hiding startup issues.

## Demo Path

For interviews, the intended demo flow is:

1. Open `http://localhost:8000/docs`.
2. Call `GET /health` to show the service and model are ready.
3. Call `GET /model-info` to show features, coefficients, and performance metrics.
4. Call `POST /predict` with a single property.
5. Call `POST /predict` with a batch payload.

This shows the full path from trained model artifact to validated API prediction.
