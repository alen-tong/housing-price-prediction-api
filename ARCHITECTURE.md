# Architecture

## Overview

The system is a multi-application portal built around a reusable housing price ML service.

```text
Browser
  |
  v
Next.js Portal
  |
  +--> Python Estimator API -----> ML Model API
  |          |
  |          +--> SQLite estimate history
  |
  +--> Java Market API ----------> ML Model API
             |
             +--> housing.csv analytics
             +--> Caffeine cached aggregates
```

## Service Responsibilities

### ML API

Path: `services/ml-api`

This is the Task 1 model service. It trains and serves a Ridge regression model through FastAPI.

Endpoints:

- `GET /health`
- `POST /predict`
- `GET /model-info`

Both downstream applications call this service for predictions.

### Estimator API

Path: `services/estimator-api`

This Python backend supports the Property Value Estimator application.

Responsibilities:

- validate property estimate submissions
- call the ML API for prediction
- persist estimate history in SQLite
- return records for history and comparison views

Endpoints:

- `GET /health`
- `POST /estimates`
- `GET /estimates`
- `GET /estimates/{id}`

### Market API

Path: `services/market-api`

This Java 21 / Spring Boot backend supports the Property Market Analysis application.

Responsibilities:

- load the housing CSV dataset
- generate aggregate market statistics
- group data into market segments
- filter, sort, and page property records
- call the ML API for what-if analysis
- export filtered data as CSV
- cache expensive aggregate and segment computations with Caffeine

Endpoints:

- `GET /health`
- `GET /market/summary`
- `GET /market/segments`
- `GET /market/properties`
- `POST /market/what-if`
- `GET /market/export.csv`

### Web Portal

Path: `apps/web`

The Next.js portal hosts both frontend applications.

Routes:

- `/` system overview
- `/estimator` property value estimator
- `/estimator/compare` side-by-side estimate comparison
- `/market` property market analysis dashboard

## Data Flow

### Estimate Submission

```text
User submits property form
  -> Next.js estimator page
  -> Python Estimator API /estimates
  -> ML API /predict
  -> SQLite history
  -> Next.js renders result, table, chart, and history
```

### Market Dashboard

```text
Next.js market page
  -> Java Market API /market/summary
  -> Java loads housing.csv and computes aggregates
  -> Caffeine caches summary and segment results
  -> Next.js renders cards, chart, filters, and table
```

### What-if Analysis

```text
User submits hypothetical property
  -> Next.js market dashboard
  -> Java Market API /market/what-if
  -> ML API /predict
  -> Java wraps prediction as what-if result
  -> Next.js renders predicted price
```

## Frontend Architecture

The frontend uses Next.js App Router.

- Server Components load initial data where useful, such as market summary and estimate history.
- Client Components handle forms, filters, charts, sorting, local comparison selection, and export actions.
- Shared UI components keep the two applications visually consistent.
- Custom hooks encapsulate API communication and loading/error state.

## Deployment

`docker-compose.yml` starts all four services:

- `ml-api` on port `8000`
- `estimator-api` on port `8001`
- `market-api` on port `8080`
- `web` on port `3000`

Internal service communication uses Docker service names, while browser calls use localhost URLs exposed through `NEXT_PUBLIC_*` environment variables.

## Design Trade-offs

- SQLite is used for estimator history to keep the demo self-contained.
- CSV loading is used for market analytics because the assignment dataset is static and small.
- Caffeine caching is used where the assignment explicitly asks for performance optimization.
- Print-to-PDF is used for PDF export to avoid a heavy reporting dependency.
- The ML API remains independent so both backends consume the same model contract.
