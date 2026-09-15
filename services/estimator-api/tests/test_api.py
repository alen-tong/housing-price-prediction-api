from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app import main
from app.repository import EstimateRepository
from app.schemas import MlPredictionResponse


SINGLE_PAYLOAD = {
    "label": "Demo property",
    "square_footage": 1550,
    "bedrooms": 3,
    "bathrooms": 2,
    "year_built": 1997,
    "lot_size": 6800,
    "distance_to_city_center": 4.1,
    "school_rating": 7.6,
}


class FakeMlClient:
    async def predict(self, _features):
        return MlPredictionResponse(
            predictions=[250829.56],
            count=1,
            model_version="test-model",
        )


@pytest.fixture()
def client(tmp_path: Path) -> TestClient:
    main.repository = EstimateRepository(tmp_path / "estimates.sqlite3")
    main.ml_client = FakeMlClient()
    with TestClient(main.app) as test_client:
        yield test_client


def test_health(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_create_and_list_estimate(client: TestClient) -> None:
    create_response = client.post("/estimates", json=SINGLE_PAYLOAD)

    assert create_response.status_code == 200
    created = create_response.json()
    assert created["label"] == "Demo property"
    assert created["predicted_price"] == 250829.56

    list_response = client.get("/estimates")
    assert list_response.status_code == 200
    body = list_response.json()
    assert body["count"] == 1
    assert body["items"][0]["id"] == created["id"]


def test_get_estimate(client: TestClient) -> None:
    created = client.post("/estimates", json=SINGLE_PAYLOAD).json()

    response = client.get(f"/estimates/{created['id']}")

    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_missing_feature_returns_422(client: TestClient) -> None:
    payload = dict(SINGLE_PAYLOAD)
    payload.pop("school_rating")

    response = client.post("/estimates", json=payload)

    assert response.status_code == 422
