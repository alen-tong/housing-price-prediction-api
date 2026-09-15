# Housing Fullstack Assignment

This repository completes the multi-application portal assignment. It contains a unified Next.js portal, a reusable ML model API, a Python estimator backend, and a Java Spring Boot market analysis backend.

## Services

| Service | Path | Port | Purpose |
| --- | --- | --- | --- |
| ML API | `services/ml-api` | `8000` | Task 1 FastAPI/scikit-learn model service |
| Estimator API | `services/estimator-api` | `8001` | Python backend for property estimate submissions and history |
| Market API | `services/market-api` | `8080` | Java backend for market analytics, caching, what-if, and CSV export |
| Web Portal | `apps/web` | `3000` | Next.js App Router portal |

## Quick Start With Docker Compose

```bash
docker compose up --build
```

Open:

- Web portal: `http://localhost:3000`
- ML Swagger: `http://localhost:8000/docs`
- Estimator Swagger: `http://localhost:8001/docs`
- Market API health: `http://localhost:8080/health`

## Local Development

### ML API

```bash
cd services/ml-api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1 VECLIB_MAXIMUM_THREADS=1 MKL_NUM_THREADS=1 python scripts/train.py
OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1 VECLIB_MAXIMUM_THREADS=1 MKL_NUM_THREADS=1 uvicorn app.main:app --reload --port 8000
```

### Estimator API

```bash
cd services/estimator-api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
ML_API_URL=http://localhost:8000 uvicorn app.main:app --reload --port 8001
```

### Market API

```bash
cd services/market-api
ML_API_URL=http://localhost:8000 HOUSING_DATASET_PATH=../../data/housing.csv mvn spring-boot:run
```

### Web Portal

```bash
cd apps/web
npm install
npm run dev
```

## Assignment Coverage

### Unified Navigation and Layout

- Next.js App Router routes: `/`, `/estimator`, `/estimator/compare`, `/market`.
- Shared navigation and layout in `apps/web/app/layout.tsx`.
- Shared UI primitives under `apps/web/components/ui`.
- `loading.tsx` and `error.tsx` provide layout-level loading and error states.

### App 1: Property Value Estimator

- Frontend form covers all model fields.
- Client-side validation is implemented with Zod in `hooks/useEstimator.ts`.
- Results are shown as a summary card, feature table, and chart.
- Estimate history is stored by the Python backend in SQLite.
- `/estimator/compare` provides side-by-side comparison.

### App 2: Property Market Analysis

- Java Spring Boot backend exposes market summary, segments, property table, what-if, and CSV export.
- Caffeine caching is enabled for summary and segment statistics.
- Dashboard includes aggregate cards, segment chart, filters, responsive table, what-if tool, CSV export, and print-to-PDF export.

## Demo Script

1. Open `http://localhost:3000`.
2. Show unified navigation between both applications.
3. Open the ML Swagger at `http://localhost:8000/docs` and show `/health`, `/predict`, and `/model-info`.
4. Go to `/estimator`, submit a property estimate, show the prediction card, chart, and history.
5. Select history rows and open `/estimator/compare`.
6. Go to `/market`, show summary cards, segment filter, table sorting/filtering, CSV export, PDF export, and what-if analysis.

## Tests

```bash
cd services/ml-api && pytest
cd services/estimator-api && pytest
cd services/market-api && mvn test
cd apps/web && npm run typecheck && npm run build
```
