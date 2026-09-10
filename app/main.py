from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Annotated, Union

from fastapi import Body, FastAPI, HTTPException, status

from app.config import APP_NAME, APP_VERSION
from app.model import ModelNotReadyError, ModelService
from app.schemas import (
    EXAMPLE_FEATURES,
    HealthResponse,
    HousingBatch,
    HousingFeatures,
    ModelInfoResponse,
    PredictionResponse,
)


model_service = ModelService()


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    try:
        model_service.load()
    except Exception:
        # Keep the API inspectable through /health even when startup artifacts are missing.
        pass
    yield


app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="Regression model API for predicting housing prices from property features.",
    lifespan=lifespan,
)


PredictRequest = Annotated[
    Union[HousingFeatures, HousingBatch],
    Body(
        openapi_examples={
            "single": {
                "summary": "Single property prediction",
                "description": "Submit one property feature object directly.",
                "value": EXAMPLE_FEATURES,
            },
            "batch": {
                "summary": "Batch property prediction",
                "description": "Submit multiple property feature objects under items.",
                "value": {
                    "items": [
                        EXAMPLE_FEATURES,
                        {
                            "square_footage": 2200,
                            "bedrooms": 4,
                            "bathrooms": 2.5,
                            "year_built": 2008,
                            "lot_size": 9600,
                            "distance_to_city_center": 7.0,
                            "school_rating": 8.8,
                        },
                    ]
                },
            },
        }
    ),
]


@app.get("/health", response_model=HealthResponse, tags=["system"])
def health() -> HealthResponse:
    return HealthResponse(
        status="ok" if model_service.is_ready else "degraded",
        model_loaded=model_service.is_ready,
        version=APP_VERSION,
        error=model_service.load_error,
    )


@app.post("/predict", response_model=PredictionResponse, tags=["prediction"])
def predict(payload: PredictRequest) -> PredictionResponse:
    items = [payload] if isinstance(payload, HousingFeatures) else payload.items
    if not items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Prediction batch must contain at least one item.",
        )

    try:
        predictions = model_service.predict(items)
    except ModelNotReadyError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return PredictionResponse(
        predictions=predictions,
        count=len(predictions),
        model_version=model_service.model_version,
    )


@app.get("/model-info", response_model=ModelInfoResponse, tags=["model"])
def model_info() -> ModelInfoResponse:
    try:
        return ModelInfoResponse(**model_service.get_model_info())
    except ModelNotReadyError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
