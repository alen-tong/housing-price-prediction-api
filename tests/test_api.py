import pytest
from fastapi.testclient import TestClient

from app.main import app


SINGLE_PAYLOAD = {
    "square_footage": 1550,
    "bedrooms": 3,
    "bathrooms": 2,
    "year_built": 1997,
    "lot_size": 6800,
    "distance_to_city_center": 4.1,
    "school_rating": 7.6,
}


@pytest.fixture()
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client


def test_health_reports_loaded_model(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["model_loaded"] is True


def test_model_info_contains_metrics_and_aligned_coefficients(client: TestClient) -> None:
    response = client.get("/model-info")

    assert response.status_code == 200
    body = response.json()
    assert body["model_type"] == "Ridge"
    assert body["target_column"] == "price"
    assert "test" in body["metrics"]
    assert {"mae", "rmse", "r2"} <= set(body["metrics"]["test"])
    assert len(body["coefficients"]) == len(body["transformed_feature_names"])


def test_single_prediction(client: TestClient) -> None:
    response = client.post("/predict", json=SINGLE_PAYLOAD)

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert len(body["predictions"]) == 1
    assert isinstance(body["predictions"][0], float)


def test_batch_prediction_preserves_count(client: TestClient) -> None:
    response = client.post(
        "/predict",
        json={
            "items": [
                SINGLE_PAYLOAD,
                {
                    "square_footage": 2200,
                    "bedrooms": 4,
                    "bathrooms": 2.5,
                    "year_built": 2008,
                    "lot_size": 9600,
                    "distance_to_city_center": 7,
                    "school_rating": 8.8,
                },
            ]
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 2
    assert len(body["predictions"]) == 2


def test_empty_batch_returns_400(client: TestClient) -> None:
    response = client.post("/predict", json={"items": []})

    assert response.status_code == 400
    assert "at least one item" in response.json()["detail"]


def test_missing_feature_returns_422(client: TestClient) -> None:
    payload = dict(SINGLE_PAYLOAD)
    payload.pop("school_rating")

    response = client.post("/predict", json=payload)

    assert response.status_code == 422
