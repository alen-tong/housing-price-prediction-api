from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


EXAMPLE_FEATURES = {
    "square_footage": 1550,
    "bedrooms": 3,
    "bathrooms": 2,
    "year_built": 1997,
    "lot_size": 6800,
    "distance_to_city_center": 4.1,
    "school_rating": 7.6,
}


class HousingFeatures(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={"examples": [EXAMPLE_FEATURES]},
    )

    square_footage: float = Field(..., gt=0)
    bedrooms: int = Field(..., ge=0, le=20)
    bathrooms: float = Field(..., ge=0, le=20)
    year_built: int = Field(..., ge=1800, le=2100)
    lot_size: float = Field(..., gt=0)
    distance_to_city_center: float = Field(..., ge=0)
    school_rating: float = Field(..., ge=0, le=10)


class EstimateCreate(HousingFeatures):
    label: str | None = Field(None, max_length=120)


class EstimateRecord(BaseModel):
    id: int
    label: str | None
    features: HousingFeatures
    predicted_price: float
    model_version: str
    created_at: datetime


class EstimateListResponse(BaseModel):
    items: list[EstimateRecord]
    count: int


class HealthResponse(BaseModel):
    status: str
    version: str
    ml_api_url: str


class MlPredictionResponse(BaseModel):
    predictions: list[float]
    count: int
    model_version: str
