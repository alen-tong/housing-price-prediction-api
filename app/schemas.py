from typing import Any

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

    square_footage: float = Field(..., gt=0, description="Interior area in square feet.")
    bedrooms: int = Field(..., ge=0, le=20, description="Number of bedrooms.")
    bathrooms: float = Field(..., ge=0, le=20, description="Number of bathrooms.")
    year_built: int = Field(..., ge=1800, le=2100, description="Year the property was built.")
    lot_size: float = Field(..., gt=0, description="Lot size in square feet.")
    distance_to_city_center: float = Field(..., ge=0, description="Distance to city center in miles.")
    school_rating: float = Field(..., ge=0, le=10, description="Nearby school rating on a 0-10 scale.")

    def as_model_input(self) -> dict[str, float]:
        return {
            "square_footage": float(self.square_footage),
            "bedrooms": float(self.bedrooms),
            "bathrooms": float(self.bathrooms),
            "year_built": float(self.year_built),
            "lot_size": float(self.lot_size),
            "distance_to_city_center": float(self.distance_to_city_center),
            "school_rating": float(self.school_rating),
        }


class HousingBatch(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "examples": [
                {
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
                }
            ]
        },
    )

    items: list[HousingFeatures] = Field(..., description="One or more properties to score.")


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    version: str
    error: str | None = None


class PredictionResponse(BaseModel):
    predictions: list[float]
    count: int
    model_version: str


class MetricValues(BaseModel):
    mae: float
    rmse: float
    r2: float


class CoefficientInfo(BaseModel):
    feature: str
    coefficient: float


class ModelInfoResponse(BaseModel):
    model_type: str
    target_column: str
    feature_columns: list[str]
    transformed_feature_names: list[str]
    coefficient_scale: str
    coefficients: list[CoefficientInfo]
    intercept: float
    metrics: dict[str, MetricValues]
    row_counts: dict[str, int]
    training_timestamp: str
    model_version: str
    dataset: dict[str, Any]
