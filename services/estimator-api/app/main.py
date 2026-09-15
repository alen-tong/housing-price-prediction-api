from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.config import APP_NAME, APP_VERSION, DB_PATH, ML_API_URL
from app.ml_client import MlApiClient, MlApiError
from app.repository import EstimateRepository
from app.schemas import EstimateCreate, EstimateListResponse, EstimateRecord, HealthResponse


repository = EstimateRepository(DB_PATH)
ml_client = MlApiClient(ML_API_URL)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    repository.init_db()
    yield


app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="Backend API for property estimate submissions and history.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse, tags=["system"])
def health() -> HealthResponse:
    return HealthResponse(status="ok", version=APP_VERSION, ml_api_url=ML_API_URL)


@app.post("/estimates", response_model=EstimateRecord, tags=["estimates"])
async def create_estimate(payload: EstimateCreate) -> EstimateRecord:
    try:
        ml_response = await ml_client.predict(payload)
    except MlApiError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    if not ml_response.predictions:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="ML API returned no predictions.",
        )

    return repository.create(
        label=payload.label,
        features=payload,
        predicted_price=ml_response.predictions[0],
        model_version=ml_response.model_version,
    )


@app.get("/estimates", response_model=EstimateListResponse, tags=["estimates"])
def list_estimates() -> EstimateListResponse:
    items = repository.list()
    return EstimateListResponse(items=items, count=len(items))


@app.get("/estimates/{estimate_id}", response_model=EstimateRecord, tags=["estimates"])
def get_estimate(estimate_id: int) -> EstimateRecord:
    estimate = repository.get(estimate_id)
    if estimate is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estimate not found")
    return estimate
