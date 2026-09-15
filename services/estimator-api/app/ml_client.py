from __future__ import annotations

import httpx

from app.config import ML_API_URL
from app.schemas import HousingFeatures, MlPredictionResponse


class MlApiError(RuntimeError):
    pass


class MlApiClient:
    def __init__(self, base_url: str = ML_API_URL, timeout: float = 10.0) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    async def predict(self, features: HousingFeatures) -> MlPredictionResponse:
        try:
            async with httpx.AsyncClient(timeout=self.timeout, trust_env=False) as client:
                response = await client.post(
                    f"{self.base_url}/predict",
                    json=features.model_dump(exclude={"label"}),
                )
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise MlApiError(f"ML API returned {exc.response.status_code}: {exc.response.text}") from exc
        except httpx.HTTPError as exc:
            raise MlApiError(f"ML API request failed: {exc}") from exc

        return MlPredictionResponse(**response.json())
