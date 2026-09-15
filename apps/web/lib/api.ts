import type {
  EstimateListResponse,
  EstimateRecord,
  HousingFeatures,
  MarketSummary,
  PagedProperties,
  SegmentStats,
  WhatIfResponse,
} from "./types";

const estimatorBaseServer = process.env.ESTIMATOR_API_URL ?? "http://127.0.0.1:8001";
const marketBaseServer = process.env.MARKET_API_URL ?? "http://127.0.0.1:8080";
const estimatorBaseClient = process.env.NEXT_PUBLIC_ESTIMATOR_API_URL ?? "http://127.0.0.1:8001";
const marketBaseClient = process.env.NEXT_PUBLIC_MARKET_API_URL ?? "http://127.0.0.1:8080";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function getEstimateHistory(server = false): Promise<EstimateListResponse> {
  return request<EstimateListResponse>(`${server ? estimatorBaseServer : estimatorBaseClient}/estimates`);
}

export async function createEstimate(
  payload: HousingFeatures & { label?: string },
): Promise<EstimateRecord> {
  return request<EstimateRecord>(`${estimatorBaseClient}/estimates`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMarketSummary(server = false): Promise<MarketSummary> {
  return request<MarketSummary>(`${server ? marketBaseServer : marketBaseClient}/market/summary`);
}

export async function getMarketSegments(groupBy = "bedrooms"): Promise<SegmentStats[]> {
  return request<SegmentStats[]>(`${marketBaseClient}/market/segments?groupBy=${encodeURIComponent(groupBy)}`);
}

export async function getMarketProperties(params: URLSearchParams): Promise<PagedProperties> {
  return request<PagedProperties>(`${marketBaseClient}/market/properties?${params.toString()}`);
}

export async function runWhatIf(payload: HousingFeatures): Promise<WhatIfResponse> {
  return request<WhatIfResponse>(`${marketBaseClient}/market/what-if`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function marketExportUrl(params: URLSearchParams) {
  return `${marketBaseClient}/market/export.csv?${params.toString()}`;
}
